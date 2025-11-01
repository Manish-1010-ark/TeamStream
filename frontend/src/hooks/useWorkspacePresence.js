// frontend/src/hooks/useWorkspacePresence.js
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export function useWorkspacePresence(workspaceSlug) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.user || !workspaceSlug) return;

    const userId = session.user.id;
    const userName =
      session.user.user_metadata?.display_name ||
      session.user.email?.split("@")[0] ||
      "User";

    setCurrentUserId(userId);

    console.log(
      `🔌 [PRESENCE HOOK] Initializing socket for workspace: ${workspaceSlug}, user: ${userName}`
    );

    // Create socket instance
    const socketInstance = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log(
        "✅ [PRESENCE HOOK] Connected to Socket.IO:",
        socketInstance.id
      );
      setIsConnected(true);

      // Join workspace room
      socketInstance.emit("join_workspace", workspaceSlug);

      // Register presence - wait a bit to ensure room is joined
      setTimeout(() => {
        socketInstance.emit("user_online", {
          workspaceSlug,
          userId,
          userName,
        });
        console.log(`👤 [PRESENCE HOOK] User ${userName} marked online`);

        // Request current presence list after a short delay
        setTimeout(() => {
          socketInstance.emit("get_presence", { workspaceSlug });
        }, 200);
      }, 100);
    });

    // Listen for presence list (initial load)
    socketInstance.on("presence_list", ({ onlineUsers: users }) => {
      console.log("📋 [PRESENCE HOOK] Received presence list:", users);
      setOnlineUsers(new Set(users));
    });

    // Listen for presence updates (real-time)
    socketInstance.on("presence_update", ({ onlineUsers: users }) => {
      console.log("🔄 [PRESENCE HOOK] Presence updated:", users);
      setOnlineUsers(new Set(users));
    });

    // Handle connection errors
    socketInstance.on("connect_error", (error) => {
      console.error("❌ [PRESENCE HOOK] Socket.IO connection error:", error);
      setIsConnected(false);
    });

    // Handle reconnection
    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(
        "🔄 [PRESENCE HOOK] Reconnected to server, attempt:",
        attemptNumber
      );
      setIsConnected(true);

      // Re-register presence after reconnection
      socketInstance.emit("user_online", {
        workspaceSlug,
        userId,
        userName,
      });
      socketInstance.emit("get_presence", { workspaceSlug });
    });

    // Handle disconnect
    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 [PRESENCE HOOK] Socket disconnected:", reason);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount or workspaceSlug change
    return () => {
      if (socketRef.current) {
        console.log("🧹 [PRESENCE HOOK] Cleaning up socket connection");

        // Notify server about going offline
        socketRef.current.emit("user_offline", {
          workspaceSlug,
          userId,
        });

        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
    };
  }, [workspaceSlug]);

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers,
    isUserOnline,
    socket,
    isConnected,
    currentUserId,
    onlineCount: onlineUsers.size,
  };
}
