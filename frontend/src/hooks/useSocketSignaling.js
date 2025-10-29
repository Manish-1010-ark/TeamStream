// frontend/src/hooks/useSocketSignaling.js
import { useState, useRef, useEffect, useCallback } from "react";
import io from "socket.io-client";

/**
 * Custom hook to manage Socket.IO connection and video room signaling
 * Handles joining/leaving rooms and exchanging peer information
 *
 * @param {string} workspaceSlug - Current workspace identifier
 * @param {string} userId - Current user's ID
 * @param {string} userName - Current user's display name
 * @returns {Object} Socket state, participants list, and control functions
 */
function useSocketSignaling(workspaceSlug, userId, userName) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  const socketRef = useRef(null);

  // Store peer ID in ref so it persists across renders
  const localPeerIdRef = useRef(null);

  /**
   * Initialize Socket.IO connection
   */
  useEffect(() => {
    console.log("🔌 [SOCKET] Initializing Socket.IO connection...");

    // Create socket connection
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ [SOCKET] Connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [SOCKET] Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [SOCKET] Connection error:", err);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log("🧹 [SOCKET] Cleaning up Socket.IO connection");
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  /**
   * Join video room - FIXED: Accepts peer ID as parameter
   */
  const joinVideoRoom = useCallback(
    (peerId) => {
      console.log("📡 [JOIN ATTEMPT] Checking requirements...");
      console.log(`   Socket ref: ${!!socketRef.current}`);
      console.log(`   Connected: ${isConnected}`);
      console.log(`   Peer ID: ${peerId || "null"}`);
      console.log(`   User ID: ${userId || "null"}`);
      console.log(`   User name: ${userName || "null"}`);

      if (!socketRef.current || !isConnected || !peerId) {
        console.warn(
          "⚠️ [JOIN BLOCKED] Cannot join video room: missing requirements",
          {
            hasSocket: !!socketRef.current,
            isConnected,
            hasPeerId: !!peerId,
            hasUserId: !!userId,
            hasUserName: !!userName,
          }
        );
        return;
      }

      // Store peer ID in ref
      localPeerIdRef.current = peerId;

      console.log("📞 [JOIN] Joining video room:", workspaceSlug);
      console.log(`   User: ${userName} (${userId})`);
      console.log(`   Peer ID: ${peerId}`);

      socketRef.current.emit("join_video_room", {
        workspaceSlug,
        userId,
        userName,
        peerId: peerId,
      });

      console.log("✅ [JOIN] Emitted join_video_room event");
    },
    [workspaceSlug, userId, userName, isConnected]
  );

  /**
   * Leave video room
   */
  const leaveVideoRoom = useCallback(() => {
    if (!socketRef.current) return;

    console.log("👋 [LEAVE] Leaving video room:", workspaceSlug);

    socketRef.current.emit("leave_video_room", {
      workspaceSlug,
    });

    // Clear participants
    setParticipants(new Map());
    localPeerIdRef.current = null;
    console.log("✅ [LEAVE] Cleared participants list");
  }, [workspaceSlug]);

  /**
   * Share peer ID with room (for updates)
   */
  const sharePeerId = useCallback(
    (peerId) => {
      if (!socketRef.current || !isConnected) return;

      console.log("🆔 [SHARE] Sharing peer ID:", peerId);

      socketRef.current.emit("share_peer_id", {
        workspaceSlug,
        peerId,
      });
    },
    [workspaceSlug, isConnected]
  );

  /**
   * Set up Socket.IO event listeners for video signaling
   */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("👂 [LISTENERS] Setting up video signaling listeners...");

    /**
     * Handle existing participants when joining
     */
    const handleExistingParticipants = (existingParticipants) => {
      console.log(
        "👥 [EXISTING] Received existing participants:",
        existingParticipants.length
      );

      const newParticipants = new Map();
      existingParticipants.forEach((participant) => {
        // Don't add ourselves to the participants list
        if (participant.peerId === localPeerIdRef.current) {
          console.log(`   ⏭️ Skipping self (${participant.peerId})`);
          return;
        }

        console.log(
          `   - ${participant.userName} (Peer: ${participant.peerId})`
        );
        newParticipants.set(participant.peerId, {
          socketId: participant.socketId,
          userId: participant.userId,
          userName: participant.userName,
          peerId: participant.peerId,
        });
      });

      setParticipants(newParticipants);
      console.log(
        `✅ [EXISTING] Updated participants map with ${newParticipants.size} entries`
      );
    };

    /**
     * Handle new user joining the call
     */
    const handleUserJoined = ({ socketId, userId, userName, peerId }) => {
      console.log("👋 [USER JOINED] New user joined call");
      console.log(`   Name: ${userName}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Socket ID: ${socketId}`);
      console.log(`   Peer ID: ${peerId}`);

      // Don't add ourselves
      if (peerId === localPeerIdRef.current) {
        console.log(`   ⏭️ Skipping self (${peerId})`);
        return;
      }

      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        newParticipants.set(peerId, {
          socketId,
          userId,
          userName,
          peerId,
        });
        console.log(
          `✅ [USER JOINED] Added to participants. Total: ${newParticipants.size}`
        );
        return newParticipants;
      });
    };

    /**
     * Handle peer ID being shared/updated
     */
    const handlePeerIdShared = ({ socketId, peerId, userName }) => {
      console.log("🆔 [PEER SHARED] Peer ID shared/updated");
      console.log(`   Name: ${userName}`);
      console.log(`   Socket ID: ${socketId}`);
      console.log(`   Peer ID: ${peerId}`);

      // Don't add ourselves
      if (peerId === localPeerIdRef.current) {
        console.log(`   ⏭️ Skipping self (${peerId})`);
        return;
      }

      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        newParticipants.set(peerId, {
          socketId,
          userName,
          peerId,
        });
        console.log(
          `✅ [PEER SHARED] Updated participants. Total: ${newParticipants.size}`
        );
        return newParticipants;
      });
    };

    /**
     * Handle user leaving the call
     */
    const handleUserLeft = ({ socketId, peerId }) => {
      console.log("👋 [USER LEFT] User left call");
      console.log(`   Socket ID: ${socketId}`);
      console.log(`   Peer ID: ${peerId}`);

      setParticipants((prev) => {
        const newParticipants = new Map(prev);

        // Remove by peerId if available
        if (peerId && newParticipants.has(peerId)) {
          newParticipants.delete(peerId);
          console.log(`   ✅ Removed by Peer ID: ${peerId}`);
        } else {
          // Fallback: remove by socketId
          for (const [key, participant] of newParticipants.entries()) {
            if (participant.socketId === socketId) {
              newParticipants.delete(key);
              console.log(
                `   ✅ Removed by Socket ID: ${socketId} (Peer: ${key})`
              );
              break;
            }
          }
        }

        console.log(
          `✅ [USER LEFT] Updated participants. Remaining: ${newParticipants.size}`
        );
        return newParticipants;
      });
    };

    // Register event listeners
    socket.on("existing_participants", handleExistingParticipants);
    socket.on("user_joined_call", handleUserJoined);
    socket.on("peer_id_shared", handlePeerIdShared);
    socket.on("user_left_call", handleUserLeft);

    console.log("✅ [LISTENERS] All signaling listeners registered");

    // Cleanup listeners
    return () => {
      console.log("🧹 [LISTENERS] Cleaning up signaling listeners");
      socket.off("existing_participants", handleExistingParticipants);
      socket.off("user_joined_call", handleUserJoined);
      socket.off("peer_id_shared", handlePeerIdShared);
      socket.off("user_left_call", handleUserLeft);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    participants,
    joinVideoRoom,
    leaveVideoRoom,
    sharePeerId,
  };
}

export default useSocketSignaling;
