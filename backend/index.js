// backend/index.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { supabase } from "./supabaseClient.js";
import liveblocksAuth from "./liveblocksAuth.js";

import authRoutes from "./authRoutes.js";
import workspaceRoutes from "./workspaceRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("socketio", io);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/liveblocks", liveblocksAuth);

// Track active video call participants per workspace
// Structure: { workspaceSlug: { socketId: { userId, userName, peerId } } }
const videoCallParticipants = {};

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // ====================
  // CHAT FUNCTIONALITY (Existing)
  // ====================

  socket.on("join_workspace", (workspaceSlug) => {
    socket.join(workspaceSlug);
    console.log(`User ${socket.id} joined room: ${workspaceSlug}`);
  });

  socket.on("send_message", async ({ content, workspaceSlug, userId }) => {
    try {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single();
      if (!workspace) throw new Error("Workspace not found");

      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert({ content, workspace_id: workspace.id, sender_id: userId })
        .select()
        .single();
      if (insertError) throw insertError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      const messageWithProfile = {
        ...newMessage,
        display_name: profile ? profile.username : "Anonymous",
      };

      io.to(workspaceSlug).emit("new_message", messageWithProfile);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  // ====================
  // VIDEO CALL SIGNALING (PeerJS)
  // ====================

  /**
   * Join video call room with PeerJS ID
   * Client sends: { workspaceSlug, userId, userName, peerId }
   */
  socket.on(
    "join_video_room",
    ({ workspaceSlug, userId, userName, peerId }) => {
      console.log(
        `🎥 User ${userName} (${socket.id}) joining video room: ${workspaceSlug} with PeerID: ${peerId}`
      );

      // Join the video room
      socket.join(`video:${workspaceSlug}`);

      // Store user info on socket for easier access
      socket.videoWorkspace = workspaceSlug;
      socket.videoUserName = userName;
      socket.videoUserId = userId;
      socket.videoPeerId = peerId;

      // Initialize participants object for this workspace if needed
      if (!videoCallParticipants[workspaceSlug]) {
        videoCallParticipants[workspaceSlug] = {};
        console.log(
          `🆕 Created new video room for workspace: ${workspaceSlug}`
        );
      }

      // Get list of existing participants (before adding current user)
      const existingParticipants = Object.entries(
        videoCallParticipants[workspaceSlug]
      ).map(([socketId, data]) => ({
        socketId,
        userId: data.userId,
        userName: data.userName,
        peerId: data.peerId,
      }));

      console.log(
        `👥 Existing participants in ${workspaceSlug}:`,
        existingParticipants.length,
        existingParticipants.map((p) => `${p.userName} (${p.peerId})`)
      );

      // Add current user to participants
      videoCallParticipants[workspaceSlug][socket.id] = {
        userId,
        userName,
        peerId,
      };

      // Send existing participants to the new user
      socket.emit("existing_participants", existingParticipants);
      console.log(
        `📤 Sent ${existingParticipants.length} existing participants to ${socket.id}`
      );

      // Notify other users in video room that someone joined (with their peer ID)
      socket.to(`video:${workspaceSlug}`).emit("user_joined_call", {
        socketId: socket.id,
        userId,
        userName,
        peerId,
      });

      // Also notify workspace (for call indicators on other pages)
      io.to(workspaceSlug).emit("call_participant_joined", {
        socketId: socket.id,
        userId,
        userName,
        peerId,
      });

      console.log(
        `📊 Active participants in ${workspaceSlug}:`,
        Object.keys(videoCallParticipants[workspaceSlug]).length
      );
    }
  );

  /**
   * Share or update PeerJS ID
   * Client sends: { workspaceSlug, peerId }
   */
  socket.on("share_peer_id", ({ workspaceSlug, peerId }) => {
    console.log(
      `🆔 User ${socket.id} (${
        socket.videoUserName || "Unknown"
      }) sharing peer ID: ${peerId}`
    );

    // Update peer ID in participants
    if (
      videoCallParticipants[workspaceSlug] &&
      videoCallParticipants[workspaceSlug][socket.id]
    ) {
      videoCallParticipants[workspaceSlug][socket.id].peerId = peerId;
      socket.videoPeerId = peerId;
    }

    // Broadcast to all users in video room
    socket.to(`video:${workspaceSlug}`).emit("peer_id_shared", {
      socketId: socket.id,
      peerId,
      userName: socket.videoUserName || "User",
    });

    console.log(`✅ Peer ID shared successfully to video room`);
  });

  /**
   * Get current call status for a workspace
   * Client sends: { workspaceSlug }
   */
  socket.on("get_call_status", ({ workspaceSlug }) => {
    console.log(
      `📊 Call status requested for workspace: ${workspaceSlug} by ${socket.id}`
    );

    const participants = videoCallParticipants[workspaceSlug];
    const participantsList = participants
      ? Object.entries(participants).map(([socketId, data]) => ({
          socketId,
          userId: data.userId,
          userName: data.userName,
          peerId: data.peerId,
        }))
      : [];

    console.log(
      `📤 Sending call status: ${participantsList.length} participants`
    );

    socket.emit("call_status", { participants: participantsList });
  });

  /**
   * Leave video call
   * Client sends: { workspaceSlug }
   */
  socket.on("leave_video_room", ({ workspaceSlug }) => {
    console.log(
      `👋 User ${socket.id} (${
        socket.videoUserName || "Unknown"
      }) leaving video room: ${workspaceSlug}`
    );
    handleUserLeaveCall(socket, workspaceSlug);
  });

  /**
   * Handle disconnection
   */
  socket.on("disconnect", () => {
    console.log(
      "❌ A user disconnected:",
      socket.id,
      socket.videoUserName ? `(${socket.videoUserName})` : ""
    );

    // Remove user from all video call rooms
    for (const workspaceSlug in videoCallParticipants) {
      if (videoCallParticipants[workspaceSlug][socket.id]) {
        console.log(
          `🧹 Cleaning up video room for ${socket.id} in workspace ${workspaceSlug}`
        );
        handleUserLeaveCall(socket, workspaceSlug);
      }
    }
  });
});

/**
 * Helper function to handle user leaving a video call
 */
function handleUserLeaveCall(socket, workspaceSlug) {
  if (
    videoCallParticipants[workspaceSlug] &&
    videoCallParticipants[workspaceSlug][socket.id]
  ) {
    const userName = videoCallParticipants[workspaceSlug][socket.id].userName;
    const peerId = videoCallParticipants[workspaceSlug][socket.id].peerId;

    // Remove user from participants
    delete videoCallParticipants[workspaceSlug][socket.id];

    // Leave the socket room
    socket.leave(`video:${workspaceSlug}`);

    // Notify other users in video room
    socket.to(`video:${workspaceSlug}`).emit("user_left_call", {
      socketId: socket.id,
      peerId,
    });

    // Also notify workspace (for call indicators)
    io.to(workspaceSlug).emit("call_participant_left", {
      socketId: socket.id,
      peerId,
    });

    const remainingCount = videoCallParticipants[workspaceSlug]
      ? Object.keys(videoCallParticipants[workspaceSlug]).length
      : 0;
    console.log(
      `✅ User ${
        userName || socket.id
      } removed from video room ${workspaceSlug}. Remaining: ${remainingCount}`
    );

    // Clean up empty workspace entries
    if (remainingCount === 0) {
      delete videoCallParticipants[workspaceSlug];
      console.log(
        `🧹 Deleted empty video room for workspace: ${workspaceSlug}`
      );
    }
  } else {
    console.log(`⚠️ User ${socket.id} was not in video room ${workspaceSlug}`);
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Video call signaling server initialized (PeerJS mode)`);
});
