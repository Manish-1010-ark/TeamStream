// frontend/src/hooks/usePeerJSConnections.js
import { useState, useRef, useEffect, useCallback } from "react";
import Peer from "peerjs";

/**
 * Custom hook to manage PeerJS instance and peer-to-peer connections
 * Handles creating peer, calling others, answering calls, and managing streams
 *
 * @param {MediaStream|null} localStream - Local media stream to send to peers
 * @param {Map} participants - Map of participants from useSocketSignaling
 * @returns {Object} Peer state, remote streams, and control functions
 */
function usePeerJSConnections(localStream, participants) {
  const [localPeerId, setLocalPeerId] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [connectionStates, setConnectionStates] = useState(new Map());

  const peerRef = useRef(null);
  const callsRef = useRef(new Map()); // Store active calls by peer ID
  const initiatedCallsRef = useRef(new Set()); // Track which peers we've called

  // ✅ CRITICAL FIX: Store localStream in a ref so it's always accessible
  const localStreamRef = useRef(null);
  const participantsRef = useRef(participants);

  // ✅ Keep refs updated with latest values
  useEffect(() => {
    console.log(
      "🔄 [STREAM REF UPDATE] Updating localStream ref:",
      !!localStream
    );
    if (localStream) {
      console.log(`   Video tracks: ${localStream.getVideoTracks().length}`);
      console.log(`   Audio tracks: ${localStream.getAudioTracks().length}`);
    }
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  /**
   * Initialize PeerJS instance
   */
  const initializePeer = useCallback(() => {
    return new Promise((resolve, reject) => {
      console.log("🔷 Initializing PeerJS...");
      console.log(`   Local stream available: ${!!localStreamRef.current}`);

      // Don't reinitialize if already exists
      if (peerRef.current && !peerRef.current.destroyed) {
        console.log("⚠️ PeerJS already initialized:", peerRef.current.id);
        resolve(peerRef.current.id);
        return;
      }

      try {
        // Create new Peer instance
        const peer = new Peer(undefined, {
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },
            ],
          },
          debug: 2, // Enable debug logging
        });

        peerRef.current = peer;

        // Handle peer open event (peer ID assigned)
        peer.on("open", (id) => {
          console.log("✅ PeerJS initialized with ID:", id);
          console.log("🔑 Peer ID ready to be shared with signaling server");
          setLocalPeerId(id);
          resolve(id);
        });

        // ✅ FIXED: Handle incoming calls using refs for latest values
        peer.on("call", (call) => {
          const remotePeerId = call.peer;
          console.log("📞 [INCOMING CALL] From peer:", remotePeerId);
          console.log(
            `   📊 [STREAM CHECK] localStreamRef.current exists: ${!!localStreamRef.current}`
          );

          if (localStreamRef.current) {
            console.log(
              `   ✅ [STREAM AVAILABLE] Has ${
                localStreamRef.current.getVideoTracks().length
              } video, ${
                localStreamRef.current.getAudioTracks().length
              } audio tracks`
            );
          }

          // ✅ Use ref to get current stream value
          const currentStream = localStreamRef.current;

          if (currentStream) {
            console.log(
              `📞 [ANSWERING CALL] Answering call from ${remotePeerId} with stream`
            );
            console.log(
              `   Video tracks: ${currentStream.getVideoTracks().length}`
            );
            console.log(
              `   Audio tracks: ${currentStream.getAudioTracks().length}`
            );

            call.answer(currentStream);
            console.log(
              `✅ [CALL ANSWERED] Successfully called call.answer() for ${remotePeerId}`
            );

            // Store call reference
            callsRef.current.set(remotePeerId, call);

            // Update connection state
            setConnectionStates((prev) => {
              const newStates = new Map(prev);
              newStates.set(remotePeerId, "connecting");
              console.log(
                `🔄 [CONNECTION STATE] ${remotePeerId}: connecting (answering call)`
              );
              return newStates;
            });

            // Handle incoming stream
            call.on("stream", (remoteStream) => {
              console.log(`📺 [STREAM RECEIVED] From peer: ${remotePeerId}`);
              console.log(
                `   Video tracks: ${remoteStream.getVideoTracks().length}`
              );
              console.log(
                `   Audio tracks: ${remoteStream.getAudioTracks().length}`
              );

              // Get participant info from participants ref
              const participant = participantsRef.current.get(remotePeerId);
              const remoteUserName = participant?.userName || "Unknown User";

              // Update remote streams state
              setRemoteStreams((prev) => {
                const newStreams = new Map(prev);
                newStreams.set(remotePeerId, {
                  stream: remoteStream,
                  userName: remoteUserName,
                  peerId: remotePeerId,
                });
                console.log(
                  `✅ [STREAM ADDED] Added stream for ${remoteUserName} (${remotePeerId})`
                );
                console.log(`   Total remote streams: ${newStreams.size}`);
                return newStreams;
              });

              // Update connection state
              setConnectionStates((prev) => {
                const newStates = new Map(prev);
                newStates.set(remotePeerId, "connected");
                console.log(`✅ [CONNECTION STATE] ${remotePeerId}: connected`);
                return newStates;
              });
            });

            // Handle call close
            call.on("close", () => {
              console.log(`📞 [CALL CLOSED] With peer: ${remotePeerId}`);
              handleCallCleanup(remotePeerId);
            });

            // Handle call error
            call.on("error", (err) => {
              console.error(`❌ [CALL ERROR] With peer ${remotePeerId}:`, err);
              setConnectionStates((prev) => {
                const newStates = new Map(prev);
                newStates.set(remotePeerId, "error");
                return newStates;
              });
            });
          } else {
            console.error(
              "❌ [ANSWER FAILED] No local stream available to answer call"
            );
            console.error(
              `   localStreamRef.current is: ${localStreamRef.current}`
            );
            console.error(
              `   This should not happen - stream should be initialized before joining`
            );
          }
        });

        // Handle peer errors
        peer.on("error", (err) => {
          console.error("❌ [PEER ERROR]", err);

          // Handle specific error types
          if (err.type === "peer-unavailable") {
            console.warn("⚠️ Peer unavailable - they may have disconnected");
          } else if (err.type === "network") {
            console.error("❌ Network error - check internet connection");
          } else if (err.type === "server-error") {
            console.error("❌ PeerJS server error");
          }

          reject(err);
        });

        // Handle peer close
        peer.on("close", () => {
          console.log("🔷 PeerJS connection closed");
        });

        // Handle peer disconnection
        peer.on("disconnected", () => {
          console.warn("⚠️ PeerJS disconnected - attempting to reconnect...");

          // Attempt to reconnect
          if (!peer.destroyed) {
            peer.reconnect();
          }
        });
      } catch (err) {
        console.error("❌ Failed to initialize PeerJS:", err);
        reject(err);
      }
    });
  }, []); // ✅ No dependencies - we use refs for dynamic values

  /**
   * Call a remote peer
   */
  const callPeer = useCallback(
    (remotePeerId, remoteUserName) => {
      // ✅ Use ref to get current stream
      const currentStream = localStreamRef.current;

      if (!peerRef.current || !currentStream) {
        console.warn(
          "⚠️ [CALL BLOCKED] Cannot call peer: PeerJS or local stream not ready"
        );
        console.warn(
          `   PeerJS: ${!!peerRef.current}, Stream: ${!!currentStream}`
        );
        return;
      }

      // Don't call if already initiated
      if (initiatedCallsRef.current.has(remotePeerId)) {
        console.log(
          `⚠️ [CALL BLOCKED] Already initiated call to ${remotePeerId}`
        );
        return;
      }

      // Don't call ourselves
      if (remotePeerId === localPeerId) {
        console.log("⚠️ [CALL BLOCKED] Cannot call self");
        return;
      }

      console.log(
        `📞 [OUTGOING CALL] Calling ${remoteUserName} (${remotePeerId})...`
      );
      console.log(
        `   Using stream with ${currentStream.getVideoTracks().length} video, ${
          currentStream.getAudioTracks().length
        } audio tracks`
      );

      try {
        // Mark as initiated
        initiatedCallsRef.current.add(remotePeerId);
        console.log(
          `✅ [CALL INITIATED] Added ${remotePeerId} to initiated calls set`
        );

        // Update connection state
        setConnectionStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(remotePeerId, "connecting");
          console.log(
            `🔄 [CONNECTION STATE] ${remotePeerId}: connecting (outgoing call)`
          );
          return newStates;
        });

        // Make the call with current stream
        const call = peerRef.current.call(remotePeerId, currentStream);

        if (!call) {
          console.error("❌ [CALL FAILED] Failed to create call object");
          initiatedCallsRef.current.delete(remotePeerId);
          return;
        }

        // Store call reference
        callsRef.current.set(remotePeerId, call);
        console.log(
          `✅ [CALL OBJECT CREATED] Stored call reference for ${remotePeerId}`
        );

        // Handle incoming stream from remote peer
        call.on("stream", (remoteStream) => {
          console.log(
            `📺 [STREAM RECEIVED] From peer: ${remoteUserName} (${remotePeerId})`
          );
          console.log(
            `   Video tracks: ${remoteStream.getVideoTracks().length}`
          );
          console.log(
            `   Audio tracks: ${remoteStream.getAudioTracks().length}`
          );

          // Update remote streams state - CRITICAL: Create new Map for React
          setRemoteStreams((prev) => {
            const newStreams = new Map(prev);
            newStreams.set(remotePeerId, {
              stream: remoteStream,
              userName: remoteUserName,
              peerId: remotePeerId,
            });
            console.log(
              `✅ [STREAM ADDED] Added stream for ${remoteUserName} (${remotePeerId})`
            );
            console.log(`   Total remote streams: ${newStreams.size}`);
            return newStreams;
          });

          // Update connection state
          setConnectionStates((prev) => {
            const newStates = new Map(prev);
            newStates.set(remotePeerId, "connected");
            console.log(`✅ [CONNECTION STATE] ${remotePeerId}: connected`);
            return newStates;
          });
        });

        // Handle call close
        call.on("close", () => {
          console.log(
            `📞 [CALL CLOSED] With ${remoteUserName} (${remotePeerId})`
          );
          handleCallCleanup(remotePeerId);
        });

        // Handle call error
        call.on("error", (err) => {
          console.error(`❌ [CALL ERROR] With ${remotePeerId}:`, err);
          initiatedCallsRef.current.delete(remotePeerId);

          setConnectionStates((prev) => {
            const newStates = new Map(prev);
            newStates.set(remotePeerId, "error");
            return newStates;
          });
        });
      } catch (err) {
        console.error(
          `❌ [CALL EXCEPTION] Error calling ${remotePeerId}:`,
          err
        );
        initiatedCallsRef.current.delete(remotePeerId);

        setConnectionStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(remotePeerId, "error");
          return newStates;
        });
      }
    },
    [localPeerId]
  ); // ✅ Only localPeerId dependency - use refs for stream

  /**
   * Clean up a specific call
   */
  const handleCallCleanup = useCallback((remotePeerId) => {
    console.log(`🧹 [CLEANUP] Cleaning up call with ${remotePeerId}`);

    // Remove from remote streams
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      const removed = newStreams.delete(remotePeerId);
      if (removed) {
        console.log(`   ✅ Removed stream for ${remotePeerId}`);
        console.log(`   Remaining streams: ${newStreams.size}`);
      }
      return newStreams;
    });

    // Remove from connection states
    setConnectionStates((prev) => {
      const newStates = new Map(prev);
      newStates.delete(remotePeerId);
      return newStates;
    });

    // Remove from initiated calls
    initiatedCallsRef.current.delete(remotePeerId);

    // Remove from calls ref
    callsRef.current.delete(remotePeerId);
  }, []);

  /**
   * Clean up all peer connections
   */
  const cleanupPeer = useCallback(() => {
    console.log("🧹 [CLEANUP ALL] Cleaning up all PeerJS connections...");

    // Close all active calls
    callsRef.current.forEach((call, peerId) => {
      console.log(`  - Closing call with ${peerId}`);
      try {
        call.close();
      } catch (err) {
        console.error(`Error closing call with ${peerId}:`, err);
      }
    });

    // Clear call tracking
    callsRef.current.clear();
    initiatedCallsRef.current.clear();

    // Destroy peer instance
    if (peerRef.current && !peerRef.current.destroyed) {
      console.log("  - Destroying peer instance");
      peerRef.current.destroy();
    }

    // Reset state
    peerRef.current = null;
    setLocalPeerId(null);
    setRemoteStreams(new Map());
    setConnectionStates(new Map());

    console.log("✅ [CLEANUP COMPLETE] PeerJS cleanup complete");
  }, []);

  /**
   * Auto-call new participants when they join
   */
  useEffect(() => {
    if (!localPeerId || !localStreamRef.current || participants.size === 0) {
      return;
    }

    console.log(
      "👥 [PARTICIPANT CHECK] Checking for new participants to call..."
    );
    console.log(`   Local Peer ID: ${localPeerId}`);
    console.log(`   Total participants: ${participants.size}`);
    console.log(`   Current remote streams: ${remoteStreams.size}`);
    console.log(`   Local stream available: ${!!localStreamRef.current}`);

    participants.forEach((participant, peerId) => {
      // Don't call ourselves
      if (peerId === localPeerId) {
        console.log(`   ⏭️ Skipping self (${peerId})`);
        return;
      }

      // Don't call if already have stream or call in progress
      if (remoteStreams.has(peerId)) {
        console.log(
          `   ⏭️ Already have stream for ${participant.userName} (${peerId})`
        );
        return;
      }

      if (callsRef.current.has(peerId)) {
        console.log(
          `   ⏭️ Call already in progress for ${participant.userName} (${peerId})`
        );
        return;
      }

      // Don't call if we've already initiated
      if (initiatedCallsRef.current.has(peerId)) {
        console.log(
          `   ⏭️ Already initiated call to ${participant.userName} (${peerId})`
        );
        return;
      }

      console.log(
        `   🆕 [NEW PARTICIPANT] Detected: ${participant.userName} (${peerId})`
      );
      callPeer(peerId, participant.userName);
    });
  }, [participants, localPeerId, remoteStreams, callPeer]);

  /**
   * Clean up removed participants
   */
  useEffect(() => {
    // Get list of peer IDs in remote streams
    const streamPeerIds = Array.from(remoteStreams.keys());

    // Check if any stream peer is no longer in participants
    streamPeerIds.forEach((peerId) => {
      if (!participants.has(peerId)) {
        console.log(`👋 [PARTICIPANT LEFT] ${peerId} left, cleaning up stream`);

        // Close the call
        const call = callsRef.current.get(peerId);
        if (call) {
          try {
            call.close();
          } catch (err) {
            console.error(`Error closing call with ${peerId}:`, err);
          }
        }

        handleCallCleanup(peerId);
      }
    });
  }, [participants, remoteStreams, handleCallCleanup]);

  return {
    localPeerId,
    remoteStreams,
    connectionStates,
    initializePeer,
    callPeer,
    cleanupPeer,
  };
}

export default usePeerJSConnections;
