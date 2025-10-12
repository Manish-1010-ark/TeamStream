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

// Socket.io (Chat) Logic
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // When a user joins a workspace page on the frontend
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

      // Insert the new message and get its data back
      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert({ content, workspace_id: workspace.id, sender_id: userId })
        .select()
        .single();
      if (insertError) throw insertError;

      // Fetch the sender's profile name separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      // Construct the final message object to send to clients
      const messageWithProfile = {
        ...newMessage,
        display_name: profile ? profile.username : "Anonymous",
      };

      // Broadcast the complete message object
      io.to(workspaceSlug).emit("new_message", messageWithProfile);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
