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

// ✅ CRITICAL: Configure allowed origins for production
const allowedOrigins = [
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:3000", // Alternative local port
  "https://team-stream-bumumf261-manishs-projects-e2ca7878.vercel.app", // Your Vercel domain
  /^https:\/\/team-stream-.*\.vercel\.app$/, // Preview deployments with regex
];

// Helper function to check if origin is allowed
function isOriginAllowed(origin) {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl, etc.)

  return allowedOrigins.some((allowed) => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
}

// ✅ Socket.IO with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Socket.IO CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  // ✅ CRITICAL: Configure transports for production
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // ✅ Add connection timeout
  connectTimeout: 45000,
});

app.set("socketio", io);
const PORT = process.env.PORT || 3001;

// ✅ Express CORS middleware with proper configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Express CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Add health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/liveblocks", liveblocksAuth);

// ===========================
// VIDEO CALL DATA STRUCTURES
// ===========================

const activeCalls = {};
const workspaceCalls = {};

// ===========================
// PRESENCE DATA STRUCTURES
// ===========================

const onlineUsers = new Map();

// ===========================
// SOCKET.IO LOGIC
// ===========================

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // ====================
  // WORKSPACE & PRESENCE
  // ====================

  socket.on("join_workspace", (workspaceSlug) => {
    socket.join(workspaceSlug);
    console.log(`User ${socket.id} joined room: ${workspaceSlug}`);
  });

  // User comes online
  socket.on("user_online", ({ workspaceSlug, userId, userName }) => {
    console.log(
      `🟢 [PRESENCE] User ${userName} (${userId}) online in ${workspaceSlug}`
    );

    // Initialize workspace set if it doesn't exist
    if (!onlineUsers.has(workspaceSlug)) {
      onlineUsers.set(workspaceSlug, new Set());
    }

    // Add user to online users for this workspace
    onlineUsers.get(workspaceSlug).add(userId);

    // Store user info in socket for cleanup
    socket.userId = userId;
    socket.workspaceSlug = workspaceSlug;
    socket.userName = userName;

    // Get current online users
    const currentOnlineUsers = Array.from(onlineUsers.get(workspaceSlug) || []);
    console.log(
      `📊 [PRESENCE] Online users in ${workspaceSlug}:`,
      currentOnlineUsers
    );

    // Broadcast to all users in the workspace
    io.to(workspaceSlug).emit("presence_update", {
      onlineUsers: currentOnlineUsers,
    });
  });

  // Handle get_presence request
  socket.on("get_presence", ({ workspaceSlug }) => {
    console.log(`📋 [PRESENCE] Request for online users in: ${workspaceSlug}`);
    const users = Array.from(onlineUsers.get(workspaceSlug) || []);
    console.log(`   Sent ${users.length} online users to ${socket.id}`);

    socket.emit("presence_list", {
      onlineUsers: users,
    });
  });

  // Handle manual user_offline event
  socket.on("user_offline", ({ workspaceSlug, userId }) => {
    console.log(
      `🔴 [PRESENCE] User ${userId} manually went offline in ${workspaceSlug}`
    );

    if (onlineUsers.has(workspaceSlug)) {
      onlineUsers.get(workspaceSlug).delete(userId);

      const currentOnlineUsers = Array.from(
        onlineUsers.get(workspaceSlug) || []
      );
      console.log(
        `📊 [PRESENCE] Updated online users in ${workspaceSlug}:`,
        currentOnlineUsers
      );

      io.to(workspaceSlug).emit("presence_update", {
        onlineUsers: currentOnlineUsers,
      });
    }
  });

  // ====================
  // CHAT FUNCTIONALITY
  // ====================

  socket.on("send_message", async ({ content, workspaceSlug, userId }) => {
    try {
      console.log(`💬 [CHAT] Message from ${userId} in ${workspaceSlug}`);

      // ✅ Validate inputs
      if (!content || !workspaceSlug || !userId) {
        console.error("❌ [CHAT] Missing required fields");
        socket.emit("message_error", { error: "Missing required fields" });
        return;
      }

      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single();

      if (workspaceError || !workspace) {
        console.error("❌ [CHAT] Workspace not found:", workspaceError);
        socket.emit("message_error", { error: "Workspace not found" });
        return;
      }

      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert({
          content,
          workspace_id: workspace.id,
          sender_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ [CHAT] Insert error:", insertError);
        socket.emit("message_error", { error: "Failed to save message" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      const messageWithProfile = {
        ...newMessage,
        display_name: profile ? profile.username : "Anonymous",
      };

      console.log("✅ [CHAT] Broadcasting message to:", workspaceSlug);
      io.to(workspaceSlug).emit("new_message", messageWithProfile);
    } catch (error) {
      console.error("❌ [CHAT] Error handling message:", error);
      socket.emit("message_error", { error: "Server error" });
    }
  });

  // ====================
  // VIDEO CALL MANAGEMENT
  // ====================

  socket.on("create_call", ({ workspaceSlug, userId, userName }) => {
    console.log(
      `🎬 [CREATE CALL] ${userName} creating call in workspace: ${workspaceSlug}`
    );

    const callId = uuidv4();

    activeCalls[callId] = {
      workspaceSlug,
      creatorId: userId,
      creatorName: userName,
      createdAt: Date.now(),
      participants: {},
    };

    if (!workspaceCalls[workspaceSlug]) {
      workspaceCalls[workspaceSlug] = [];
    }
    workspaceCalls[workspaceSlug].push(callId);

    console.log(`✅ [CALL CREATED] Call ID: ${callId}`);

    socket.emit("call_created", {
      callId,
      workspaceSlug,
      creatorName: userName,
      participantCount: 0,
    });

    socket.to(workspaceSlug).emit("call_created", {
      callId,
      workspaceSlug,
      creatorName: userName,
      participantCount: 0,
    });

    console.log(`📢 [BROADCAST] Call creation broadcasted to ${workspaceSlug}`);
  });

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
      .filter(Boolean);

    console.log(`   Found ${calls.length} active calls`);

    socket.emit("active_calls_list", { workspaceSlug, calls });
  });

  socket.on(
    "join_call",
    ({ callId, workspaceSlug, userId, userName, peerId }) => {
      console.log(
        `🎥 [JOIN CALL] ${userName} (${socket.id}) joining call: ${callId}`
      );

      if (!activeCalls[callId]) {
        console.error(`❌ [JOIN FAILED] Call ${callId} does not exist`);
        socket.emit("call_error", {
          message: "Call not found or has ended",
        });
        return;
      }

      socket.join(`call:${callId}`);

      socket.currentCallId = callId;
      socket.videoWorkspace = workspaceSlug;
      socket.videoUserName = userName;
      socket.videoUserId = userId;
      socket.videoPeerId = peerId;

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

      activeCalls[callId].participants[socket.id] = {
        userId,
        userName,
        peerId,
      };

      const participantCount = Object.keys(
        activeCalls[callId].participants
      ).length;

      socket.emit("existing_participants", existingParticipants);
      console.log(
        `📤 Sent ${existingParticipants.length} existing participants to ${socket.id}`
      );

      socket.to(`call:${callId}`).emit("user_joined_call", {
        socketId: socket.id,
        userId,
        userName,
        peerId,
      });

      io.to(workspaceSlug).emit("call_participant_count_updated", {
        callId,
        participantCount,
      });

      console.log(
        `✅ [JOIN SUCCESS] ${userName} joined call ${callId}. Total participants: ${participantCount}`
      );
    }
  );

  socket.on("leave_call", ({ callId }) => {
    console.log(
      `👋 [LEAVE CALL] ${socket.id} (${
        socket.videoUserName || "Unknown"
      }) leaving call: ${callId}`
    );
    handleUserLeaveCall(socket, callId);
  });

  socket.on("share_peer_id", ({ callId, peerId }) => {
    console.log(
      `🆔 [SHARE PEER] User ${socket.id} sharing peer ID: ${peerId} in call: ${callId}`
    );

    if (activeCalls[callId] && activeCalls[callId].participants[socket.id]) {
      activeCalls[callId].participants[socket.id].peerId = peerId;
      socket.videoPeerId = peerId;
    }

    socket.to(`call:${callId}`).emit("peer_id_shared", {
      socketId: socket.id,
      peerId,
      userName: socket.videoUserName || "User",
    });

    console.log(`✅ Peer ID shared successfully in call ${callId}`);
  });

  // ====================
  // DISCONNECTION HANDLING
  // ====================

  socket.on("disconnect", (reason) => {
    console.log(
      `❌ A user disconnected: ${socket.id} (${socket.userName || "Unknown"})`
    );
    console.log(`   Reason: ${reason}`);

    // Handle presence cleanup
    if (socket.workspaceSlug && socket.userId) {
      const workspaceSlug = socket.workspaceSlug;
      const userId = socket.userId;

      console.log(
        `🧹 [PRESENCE] Cleaning up user ${userId} from ${workspaceSlug}`
      );

      if (onlineUsers.has(workspaceSlug)) {
        onlineUsers.get(workspaceSlug).delete(userId);

        if (onlineUsers.get(workspaceSlug).size === 0) {
          onlineUsers.delete(workspaceSlug);
        }

        const currentOnlineUsers = Array.from(
          onlineUsers.get(workspaceSlug) || []
        );
        console.log(
          `📊 [PRESENCE] Updated online users in ${workspaceSlug}:`,
          currentOnlineUsers
        );

        io.to(workspaceSlug).emit("presence_update", {
          onlineUsers: currentOnlineUsers,
        });
      }
    }

    // Handle video call cleanup
    if (socket.currentCallId) {
      console.log(
        `🧹 Cleaning up call ${socket.currentCallId} for ${socket.id}`
      );
      handleUserLeaveCall(socket, socket.currentCallId);
    }
  });
});

// Helper function to handle user leaving a call
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

  delete activeCalls[callId].participants[socket.id];

  socket.leave(`call:${callId}`);

  const remainingCount = Object.keys(activeCalls[callId].participants).length;

  socket.to(`call:${callId}`).emit("user_left_call", {
    socketId: socket.id,
    peerId,
  });

  console.log(
    `✅ User ${
      userName || socket.id
    } removed from call ${callId}. Remaining: ${remainingCount}`
  );

  if (remainingCount === 0) {
    console.log(
      `🏁 [CALL ENDED] Call ${callId} has no participants, ending...`
    );

    delete activeCalls[callId];

    if (workspaceCalls[workspaceSlug]) {
      workspaceCalls[workspaceSlug] = workspaceCalls[workspaceSlug].filter(
        (id) => id !== callId
      );

      if (workspaceCalls[workspaceSlug].length === 0) {
        delete workspaceCalls[workspaceSlug];
      }
    }

    io.to(workspaceSlug).emit("call_ended", { callId });

    console.log(
      `📢 [BROADCAST] Call ${callId} ended, broadcasted to ${workspaceSlug}`
    );
  } else {
    io.to(workspaceSlug).emit("call_participant_count_updated", {
      callId,
      participantCount: remainingCount,
    });
  }
}

// ✅ Graceful shutdown handler
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for allowed origins`);
  console.log(`✅ Socket.IO transports: websocket, polling`);
  console.log(`✅ Video call signaling server initialized`);
});
