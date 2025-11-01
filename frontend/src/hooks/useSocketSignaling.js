// frontend/src/hooks/useSocketSignaling.js
import { useState, useRef, useEffect, useCallback } from "react";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Custom hook to manage Socket.IO connection and video call signaling
 * Supports multi-call system with call IDs
 *
 * @param {string} workspaceSlug - Current workspace identifier
 * @param {string} userId - Current user's ID
 * @param {string} userName - Current user's display name
 * @param {string|null} callId - Specific call ID to join (null for lobby)
 * @returns {Object} Socket state, participants, calls list, and control functions
 */
function useSocketSignaling(workspaceSlug, userId, userName, callId = null) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  const [activeCalls, setActiveCalls] = useState([]);
  const socketRef = useRef(null);

  // Store peer ID and callId in refs
  const localPeerIdRef = useRef(null);
  const currentCallIdRef = useRef(callId);

  // Update callId ref when it changes
  useEffect(() => {
    currentCallIdRef.current = callId;
  }, [callId]);

  /**
   * Initialize Socket.IO connection
   */
  useEffect(() => {
    console.log("🔌 [SOCKET] Initializing Socket.IO connection...");

    // Create socket connection
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ [SOCKET] Connected:", socket.id);
      setIsConnected(true);

      // Auto-join workspace room for lobby updates
      if (workspaceSlug) {
        socket.emit("join_workspace", workspaceSlug);
        console.log(`📍 [SOCKET] Joined workspace room: ${workspaceSlug}`);
      }
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
  }, [workspaceSlug]);

  /**
   * Create a new call
   */
  const createCall = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        console.warn("⚠️ [CREATE CALL] Socket not connected");
        reject(new Error("Not connected to server"));
        return;
      }

      console.log("🎬 [CREATE CALL] Creating new call...");
      console.log(`   Workspace: ${workspaceSlug}`);
      console.log(`   User: ${userName} (${userId})`);

      // Listen for call_created event once
      const handleCallCreated = ({ callId }) => {
        console.log(`✅ [CALL CREATED] Received callId: ${callId}`);
        socketRef.current.off("call_created", handleCallCreated);
        resolve(callId);
      };

      socketRef.current.once("call_created", handleCallCreated);

      // Emit create_call event
      socketRef.current.emit("create_call", {
        workspaceSlug,
        userId,
        userName,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        socketRef.current.off("call_created", handleCallCreated);
        reject(new Error("Call creation timeout"));
      }, 5000);
    });
  }, [workspaceSlug, userId, userName, isConnected]);

  /**
   * Get list of active calls in workspace
   */
  const getActiveCalls = useCallback(() => {
    if (!socketRef.current || !isConnected) {
      console.warn("⚠️ [GET CALLS] Socket not connected");
      return;
    }

    console.log("📋 [GET CALLS] Requesting active calls for:", workspaceSlug);

    socketRef.current.emit("get_active_calls", { workspaceSlug });
  }, [workspaceSlug, isConnected]);

  /**
   * Join a specific call with peer ID
   */
  const joinCall = useCallback(
    (targetCallId, peerId) => {
      console.log("📡 [JOIN CALL] Checking requirements...");
      console.log(`   Socket ref: ${!!socketRef.current}`);
      console.log(`   Connected: ${isConnected}`);
      console.log(`   Call ID: ${targetCallId || "null"}`);
      console.log(`   Peer ID: ${peerId || "null"}`);
      console.log(`   User ID: ${userId || "null"}`);
      console.log(`   User name: ${userName || "null"}`);

      if (!socketRef.current || !isConnected || !targetCallId || !peerId) {
        console.warn(
          "⚠️ [JOIN BLOCKED] Cannot join call: missing requirements",
          {
            hasSocket: !!socketRef.current,
            isConnected,
            hasCallId: !!targetCallId,
            hasPeerId: !!peerId,
            hasUserId: !!userId,
            hasUserName: !!userName,
          }
        );
        return;
      }

      // Store peer ID in ref
      localPeerIdRef.current = peerId;
      currentCallIdRef.current = targetCallId;

      console.log("📞 [JOIN CALL] Joining call:", targetCallId);
      console.log(`   User: ${userName} (${userId})`);
      console.log(`   Peer ID: ${peerId}`);

      socketRef.current.emit("join_call", {
        callId: targetCallId,
        workspaceSlug,
        userId,
        userName,
        peerId,
      });

      console.log("✅ [JOIN CALL] Emitted join_call event");
    },
    [workspaceSlug, userId, userName, isConnected]
  );

  /**
   * Leave current call
   */
  const leaveCall = useCallback((targetCallId) => {
    if (!socketRef.current) return;

    const callIdToLeave = targetCallId || currentCallIdRef.current;

    if (!callIdToLeave) {
      console.warn("⚠️ [LEAVE CALL] No call ID to leave");
      return;
    }

    console.log("👋 [LEAVE CALL] Leaving call:", callIdToLeave);

    socketRef.current.emit("leave_call", {
      callId: callIdToLeave,
    });

    // Clear state
    setParticipants(new Map());
    localPeerIdRef.current = null;
    currentCallIdRef.current = null;

    console.log("✅ [LEAVE CALL] Left call and cleared state");
  }, []);

  /**
   * Share peer ID with call
   */
  const sharePeerId = useCallback(
    (peerId, targetCallId) => {
      if (!socketRef.current || !isConnected) return;

      const callIdForShare = targetCallId || currentCallIdRef.current;

      if (!callIdForShare) {
        console.warn("⚠️ [SHARE PEER] No call ID");
        return;
      }

      console.log("🆔 [SHARE PEER] Sharing peer ID:", peerId);

      socketRef.current.emit("share_peer_id", {
        callId: callIdForShare,
        peerId,
      });
    },
    [isConnected]
  );

  /**
   * Set up Socket.IO event listeners for video signaling
   */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("👂 [LISTENERS] Setting up video signaling listeners...");

    /**
     * Handle list of active calls in workspace
     */
    const handleActiveCallsList = ({ workspaceSlug: ws, calls }) => {
      console.log(
        `📋 [ACTIVE CALLS] Received ${calls.length} calls for workspace: ${ws}`
      );
      if (ws === workspaceSlug) {
        setActiveCalls(calls);
      }
    };

    /**
     * Handle new call created
     */
    const handleCallCreated = ({ callId, creatorName, participantCount }) => {
      console.log("🎬 [CALL CREATED] New call in workspace");
      console.log(`   Call ID: ${callId}`);
      console.log(`   Creator: ${creatorName}`);

      // Update active calls list
      setActiveCalls((prev) => [
        ...prev,
        {
          callId,
          creatorName,
          participantCount,
          createdAt: Date.now(),
        },
      ]);
    };

    /**
     * Handle call ended
     */
    const handleCallEnded = ({ callId }) => {
      console.log("🏁 [CALL ENDED] Call ended:", callId);

      // Remove from active calls list
      setActiveCalls((prev) => prev.filter((call) => call.callId !== callId));

      // If we're in this call, clear participants
      if (currentCallIdRef.current === callId) {
        console.log("   We were in this call, clearing state");
        setParticipants(new Map());
      }
    };

    /**
     * Handle participant count update
     */
    const handleParticipantCountUpdated = ({ callId, participantCount }) => {
      console.log(
        `👥 [PARTICIPANT COUNT] Call ${callId}: ${participantCount} participants`
      );

      // Update the specific call in active calls list
      setActiveCalls((prev) =>
        prev.map((call) =>
          call.callId === callId ? { ...call, participantCount } : call
        )
      );
    };

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
        // Don't add ourselves
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

    /**
     * Handle call error
     */
    const handleCallError = ({ message }) => {
      console.error("❌ [CALL ERROR]", message);
      // You can emit this to parent component via callback if needed
    };

    // Register event listeners
    socket.on("active_calls_list", handleActiveCallsList);
    socket.on("call_created", handleCallCreated);
    socket.on("call_ended", handleCallEnded);
    socket.on("call_participant_count_updated", handleParticipantCountUpdated);
    socket.on("existing_participants", handleExistingParticipants);
    socket.on("user_joined_call", handleUserJoined);
    socket.on("peer_id_shared", handlePeerIdShared);
    socket.on("user_left_call", handleUserLeft);
    socket.on("call_error", handleCallError);

    console.log("✅ [LISTENERS] All signaling listeners registered");

    // Cleanup listeners
    return () => {
      console.log("🧹 [LISTENERS] Cleaning up signaling listeners");
      socket.off("active_calls_list", handleActiveCallsList);
      socket.off("call_created", handleCallCreated);
      socket.off("call_ended", handleCallEnded);
      socket.off(
        "call_participant_count_updated",
        handleParticipantCountUpdated
      );
      socket.off("existing_participants", handleExistingParticipants);
      socket.off("user_joined_call", handleUserJoined);
      socket.off("peer_id_shared", handlePeerIdShared);
      socket.off("user_left_call", handleUserLeft);
      socket.off("call_error", handleCallError);
    };
  }, [workspaceSlug]);

  // Auto-fetch active calls when connected
  useEffect(() => {
    if (isConnected && workspaceSlug && !callId) {
      // Only fetch if we're in lobby (no specific callId)
      console.log("🔄 [AUTO FETCH] Fetching active calls on connect");
      getActiveCalls();
    }
  }, [isConnected, workspaceSlug, callId, getActiveCalls]);

  return {
    socket: socketRef.current,
    isConnected,
    participants,
    activeCalls,
    createCall,
    getActiveCalls,
    joinCall,
    leaveCall,
    sharePeerId,
  };
}

export default useSocketSignaling;
