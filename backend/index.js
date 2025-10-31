// backend/index.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { supabase } from "./supabaseClient.js";
import liveblocksAuth from "./liveblocksAuth.js";
import { v4 as uuidv4 } from "uuid";

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

// ===========================
// VIDEO CALL DATA STRUCTURES
// ===========================

/**
 * Store all active calls across all workspaces
 * Structure: {
 *   callId: {
 *     workspaceSlug: string,
 *     creatorId: string,
 *     creatorName: string,
 *     createdAt: timestamp,
 *     participants: {
 *       socketId: { userId, userName, peerId }
 *     }
 *   }
 * }
 */
const activeCalls = {};

/**
 * Map workspace to its active call IDs
 * Structure: { workspaceSlug: [callId1, callId2, ...] }
 */
const workspaceCalls = {};

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // ====================
  // CHAT FUNCTIONALITY (Existing - Unchanged)
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
  // VIDEO CALL MANAGEMENT (New Multi-Call System)
  // ====================

  /**
   * Create a new call in the workspace
   * Client sends: { workspaceSlug, userId, userName }
   */
  socket.on("create_call", ({ workspaceSlug, userId, userName }) => {
    console.log(
      `🎬 [CREATE CALL] ${userName} creating call in workspace: ${workspaceSlug}`
    );

    // Generate unique call ID
    const callId = uuidv4();

    // Initialize call data
    activeCalls[callId] = {
      workspaceSlug,
      creatorId: userId,
      creatorName: userName,
      createdAt: Date.now(),
      participants: {},
    };

    // Add to workspace calls list
    if (!workspaceCalls[workspaceSlug]) {
      workspaceCalls[workspaceSlug] = [];
    }
    workspaceCalls[workspaceSlug].push(callId);

    console.log(`✅ [CALL CREATED] Call ID: ${callId}`);
    console.log(`   Workspace: ${workspaceSlug}`);
    console.log(`   Creator: ${userName} (${userId})`);

    // Send callId back to creator
    socket.emit("call_created", {
      callId,
      workspaceSlug,
      creatorName: userName,
      participantCount: 0,
    });

    // Broadcast to all users in workspace
    socket.to(workspaceSlug).emit("call_created", {
      callId,
      workspaceSlug,
      creatorName: userName,
      participantCount: 0,
    });

    console.log(`📢 [BROADCAST] Call creation broadcasted to ${workspaceSlug}`);
  });

  /**
   * Get list of active calls in workspace
   * Client sends: { workspaceSlug }
   */
  socket.on("get_active_calls", ({ workspaceSlug }) => {
    console.log(`📋 [GET CALLS] Request for active calls in: ${workspaceSlug}`);

    const callIds = workspaceCalls[workspaceSlug] || [];
    const calls = callIds
      .map((callId) => {
        const call = activeCalls[callId];
        if (!call) return null;

        return {
          callId,
          creatorName: call.creatorName,
          participantCount: Object.keys(call.participants).length,
          createdAt: call.createdAt,
        };
      })
      .filter(Boolean); // Remove null entries

    console.log(`   Found ${calls.length} active calls`);

    socket.emit("active_calls_list", { workspaceSlug, calls });
  });

  /**
   * Join a specific call
   * Client sends: { callId, workspaceSlug, userId, userName, peerId }
   */
  socket.on(
    "join_call",
    ({ callId, workspaceSlug, userId, userName, peerId }) => {
      console.log(
        `🎥 [JOIN CALL] ${userName} (${socket.id}) joining call: ${callId}`
      );

      // Verify call exists
      if (!activeCalls[callId]) {
        console.error(`❌ [JOIN FAILED] Call ${callId} does not exist`);
        socket.emit("call_error", {
          message: "Call not found or has ended",
        });
        return;
      }

      // Join the call's socket room
      socket.join(`call:${callId}`);

      // Store call info on socket
      socket.currentCallId = callId;
      socket.videoWorkspace = workspaceSlug;
      socket.videoUserName = userName;
      socket.videoUserId = userId;
      socket.videoPeerId = peerId;

      // Get existing participants before adding current user
      const existingParticipants = Object.entries(
        activeCalls[callId].participants
      ).map(([socketId, data]) => ({
        socketId,
        userId: data.userId,
        userName: data.userName,
        peerId: data.peerId,
      }));

      console.log(
        `👥 Existing participants in call ${callId}:`,
        existingParticipants.length
      );

      // Add user to call participants
      activeCalls[callId].participants[socket.id] = {
        userId,
        userName,
        peerId,
      };

      const participantCount = Object.keys(
        activeCalls[callId].participants
      ).length;

      // Send existing participants to new user
      socket.emit("existing_participants", existingParticipants);
      console.log(
        `📤 Sent ${existingParticipants.length} existing participants to ${socket.id}`
      );

      // Notify others in call that someone joined
      socket.to(`call:${callId}`).emit("user_joined_call", {
        socketId: socket.id,
        userId,
        userName,
        peerId,
      });

      // Broadcast participant count update to workspace
      io.to(workspaceSlug).emit("call_participant_count_updated", {
        callId,
        participantCount,
      });

      console.log(
        `✅ [JOIN SUCCESS] ${userName} joined call ${callId}. Total participants: ${participantCount}`
      );
    }
  );

  /**
   * Leave a specific call
   * Client sends: { callId }
   */
  socket.on("leave_call", ({ callId }) => {
    console.log(
      `👋 [LEAVE CALL] ${socket.id} (${
        socket.videoUserName || "Unknown"
      }) leaving call: ${callId}`
    );
    handleUserLeaveCall(socket, callId);
  });

  /**
   * Share or update PeerJS ID within a call
   * Client sends: { callId, peerId }
   */
  socket.on("share_peer_id", ({ callId, peerId }) => {
    console.log(
      `🆔 [SHARE PEER] User ${socket.id} sharing peer ID: ${peerId} in call: ${callId}`
    );

    // Update peer ID in call participants
    if (activeCalls[callId] && activeCalls[callId].participants[socket.id]) {
      activeCalls[callId].participants[socket.id].peerId = peerId;
      socket.videoPeerId = peerId;
    }

    // Broadcast to others in the call
    socket.to(`call:${callId}`).emit("peer_id_shared", {
      socketId: socket.id,
      peerId,
      userName: socket.videoUserName || "User",
    });

    console.log(`✅ Peer ID shared successfully in call ${callId}`);
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

    // Remove user from any call they're in
    if (socket.currentCallId) {
      console.log(
        `🧹 Cleaning up call ${socket.currentCallId} for ${socket.id}`
      );
      handleUserLeaveCall(socket, socket.currentCallId);
    }
  });
});

/**
 * Helper function to handle user leaving a call
 */
function handleUserLeaveCall(socket, callId) {
  if (!activeCalls[callId]) {
    console.log(`⚠️ Call ${callId} does not exist`);
    return;
  }

  if (!activeCalls[callId].participants[socket.id]) {
    console.log(`⚠️ User ${socket.id} was not in call ${callId}`);
    return;
  }

  const userName = activeCalls[callId].participants[socket.id].userName;
  const peerId = activeCalls[callId].participants[socket.id].peerId;
  const workspaceSlug = activeCalls[callId].workspaceSlug;

  // Remove user from call participants
  delete activeCalls[callId].participants[socket.id];

  // Leave the call room
  socket.leave(`call:${callId}`);

  const remainingCount = Object.keys(activeCalls[callId].participants).length;

  // Notify others in call that user left
  socket.to(`call:${callId}`).emit("user_left_call", {
    socketId: socket.id,
    peerId,
  });

  console.log(
    `✅ User ${
      userName || socket.id
    } removed from call ${callId}. Remaining: ${remainingCount}`
  );

  // If call is now empty, end the call
  if (remainingCount === 0) {
    console.log(
      `🏁 [CALL ENDED] Call ${callId} has no participants, ending...`
    );

    // Remove from active calls
    delete activeCalls[callId];

    // Remove from workspace calls list
    if (workspaceCalls[workspaceSlug]) {
      workspaceCalls[workspaceSlug] = workspaceCalls[workspaceSlug].filter(
        (id) => id !== callId
      );

      // Clean up empty workspace entries
      if (workspaceCalls[workspaceSlug].length === 0) {
        delete workspaceCalls[workspaceSlug];
      }
    }

    // Broadcast call ended to workspace
    io.to(workspaceSlug).emit("call_ended", { callId });

    console.log(
      `📢 [BROADCAST] Call ${callId} ended, broadcasted to ${workspaceSlug}`
    );
  } else {
    // Update participant count
    io.to(workspaceSlug).emit("call_participant_count_updated", {
      callId,
      participantCount: remainingCount,
    });
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `✅ Video call signaling server initialized (Multi-call PeerJS mode)`
  );
});
