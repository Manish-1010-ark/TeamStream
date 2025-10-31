// frontend/src/pages/workspace/VideoPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useSocketSignaling from "../../hooks/useSocketSignaling";
import useUserMedia from "../../hooks/useUserMedia";
import usePeerJSConnections from "../../hooks/usePeerJSConnections";
import PreCallLobby from "../../components/PreCallLobby";
import CallScreen from "../../components/CallScreen";
import ActiveCallCard from "../../components/ActiveCallCard";

/**
 * VideoPage - Main video call coordinator
 * NOW: Single source of truth for ALL persistent state
 * Manages media, peer connections, and call lifecycle
 */
function VideoPage() {
  const { workspaceSlug } = useParams();

  // User state
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");

  // Call flow state
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callStage, setCallStage] = useState("lobby"); // 'lobby' | 'precall' | 'incall'
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CRITICAL FIX: Initialize media and peer at component level (persistent)
  // These hooks are ALWAYS active, not conditional on callStage
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    error: mediaError,
    isLoading: mediaLoading,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
  } = useUserMedia();

  // ✅ Socket for LOBBY (listing active calls, creating calls)
  const {
    isConnected: socketConnected,
    activeCalls,
    createCall,
    getActiveCalls,
  } = useSocketSignaling(workspaceSlug, userId, userName, null);

  // ✅ Socket for IN-CALL (call-specific signaling)
  // Only connect when in a call
  const {
    isConnected: callSocketConnected,
    participants: callParticipants,
    joinCall: socketJoinCall,
    leaveCall: socketLeaveCall,
  } = useSocketSignaling(
    workspaceSlug,
    userId,
    userName,
    callStage === "incall" ? currentCallId : null
  );

  // ✅ PERSISTENT peer connections - always active once initialized
  const {
    localPeerId,
    remoteStreams,
    connectionStates,
    initializePeer,
    cleanupPeer,
  } = usePeerJSConnections(
    localStream,
    callStage === "incall" ? callParticipants : new Map()
  );

  // Load user info from session
  useEffect(() => {
    console.log("🚀 [VIDEO PAGE] Mounted");

    try {
      const session = JSON.parse(localStorage.getItem("session"));
      if (session?.user) {
        const uid = session.user.id;
        const uname =
          session.user.user_metadata?.display_name ||
          session.user.email?.split("@")[0] ||
          "User";

        setUserId(uid);
        setUserName(uname);
        console.log(`👤 [USER] Loaded: ${uname} (${uid})`);
      } else {
        console.warn("⚠️ [USER] No session found");
        setError("User session not found. Please log in.");
      }
    } catch (err) {
      console.error("❌ [USER] Error loading session:", err);
      setError("Failed to load user session.");
    }
  }, []);

  // Fetch active calls when connected to lobby
  useEffect(() => {
    if (socketConnected && userId && callStage === "lobby") {
      console.log("🔄 [LOBBY] Fetching active calls...");
      getActiveCalls();
    }
  }, [socketConnected, userId, callStage, getActiveCalls]);

  // ✅ CRITICAL: Cleanup ONLY on unmount, not on stage changes
  useEffect(() => {
    return () => {
      console.log("🧹 [VIDEO PAGE] Unmounting - final cleanup");
      stopMedia();
      cleanupPeer();
    };
  }, [stopMedia, cleanupPeer]);

  /**
   * Handle creating a new call
   */
  const handleCreateCall = async () => {
    if (!userId || !userName) {
      setError("User information not available. Please refresh the page.");
      return;
    }

    if (!socketConnected) {
      setError(
        "Not connected to server. Please check your internet connection."
      );
      return;
    }

    console.log("🎬 [CREATE] Creating new call...");
    setError(null);
    setIsCreatingCall(true);

    try {
      // Create call via socket
      const callId = await createCall();
      console.log(`✅ [CREATE] Call created with ID: ${callId}`);

      // Set current call
      setCurrentCallId(callId);

      // Move to pre-call stage
      setCallStage("precall");
      setIsCreatingCall(false);
    } catch (err) {
      console.error("❌ [CREATE] Failed:", err);
      setError(err.message || "Failed to create call. Please try again.");
      setIsCreatingCall(false);
    }
  };

  /**
   * Handle joining an existing call
   */
  const handleJoinCall = (callId) => {
    console.log("📞 [JOIN] Joining call:", callId);
    setCurrentCallId(callId);
    setIsCreatingCall(false);
    setCallStage("precall");
  };

  /**
   * Handle pre-call ready (user clicked "Join Now")
   */
  const handlePreCallReady = async () => {
    console.log("✅ [PRE-CALL] User ready, transitioning to call screen");

    // Verify we have everything we need
    if (!localStream) {
      console.error("❌ [PRE-CALL] No local stream");
      setError("Media stream not ready. Please try again.");
      return;
    }

    if (!localPeerId) {
      console.error("❌ [PRE-CALL] No peer ID");
      setError("Connection not ready. Please try again.");
      return;
    }

    console.log("🎥 [PRE-CALL] Stream ready:", {
      videoTracks: localStream.getVideoTracks().length,
      audioTracks: localStream.getAudioTracks().length,
    });
    console.log("🆔 [PRE-CALL] Peer ID:", localPeerId);

    // ✅ CRITICAL: Just change stage - DON'T cleanup anything
    // The media and peer are persistent and will be passed to CallScreen
    setCallStage("incall");
  };

  /**
   * Handle canceling pre-call lobby
   */
  const handleCancelPreCall = () => {
    console.log("❌ [PRE-CALL] Cancelled");

    // Stop media and cleanup peer
    stopMedia();
    cleanupPeer();

    // Return to lobby
    setCallStage("lobby");
    setCurrentCallId(null);
    setIsCreatingCall(false);

    // Refresh active calls
    getActiveCalls();
  };

  /**
   * Handle leaving call
   */
  const handleLeaveCall = () => {
    console.log("👋 [LEAVE] Leaving call");

    // Leave via socket first
    if (currentCallId) {
      socketLeaveCall(currentCallId);
    }

    // Stop media and cleanup peer
    stopMedia();
    cleanupPeer();

    // Return to lobby
    setCallStage("lobby");
    setCurrentCallId(null);

    // Refresh active calls
    getActiveCalls();
  };

  /**
   * ✅ CRITICAL FIX: Initialize media ONLY when entering pre-call
   * This happens ONCE and persists through the entire call
   */
  useEffect(() => {
    if (callStage === "precall" && !localStream && !mediaLoading) {
      console.log("🎥 [PRE-CALL] Initializing media and peer...");

      startMedia()
        .then(() => {
          console.log("✅ [MEDIA] Started, initializing peer...");
          return initializePeer();
        })
        .then((id) => {
          console.log("✅ [PEER] Initialized with ID:", id);
        })
        .catch((err) => {
          console.error("❌ [INIT] Media/Peer error:", err);
          setError(err.message || "Failed to access camera/microphone");
          // Return to lobby on error
          setCallStage("lobby");
          setCurrentCallId(null);
        });
    }
  }, [callStage, localStream, mediaLoading, startMedia, initializePeer]);

  // ✅ Join call via socket when entering in-call stage
  useEffect(() => {
    if (
      callStage === "incall" &&
      currentCallId &&
      localPeerId &&
      callSocketConnected
    ) {
      console.log("📡 [IN-CALL] Joining call via socket...");
      console.log(`   Call ID: ${currentCallId}`);
      console.log(`   Peer ID: ${localPeerId}`);

      socketJoinCall(currentCallId, localPeerId);
    }
  }, [
    callStage,
    currentCallId,
    localPeerId,
    callSocketConnected,
    socketJoinCall,
  ]);

  // Render based on call stage
  if (callStage === "incall") {
    return (
      <CallScreen
        callId={currentCallId}
        workspaceSlug={workspaceSlug}
        userId={userId}
        userName={userName}
        localStream={localStream}
        localPeerId={localPeerId}
        remoteStreams={remoteStreams}
        connectionStates={connectionStates}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeaveCall}
      />
    );
  }

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Video Calls
          </h1>
          <p className="text-slate-400">
            {workspaceSlug && `Workspace: ${workspaceSlug}`}
          </p>
        </div>
      </div>

      {/* Lobby Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Create New Call Button */}
          <div className="mb-8">
            <button
              onClick={handleCreateCall}
              disabled={
                !userId || !userName || !socketConnected || isCreatingCall
              }
              className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 p-8 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-500 rounded-xl shadow-lg hover:shadow-xl transition-all group"
            >
              {isCreatingCall ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-xl font-bold">Creating call...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xl font-bold">
                    {!socketConnected
                      ? "Connecting to server..."
                      : !userId || !userName
                      ? "Loading user info..."
                      : "Start an instant meeting"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Active Calls Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-200">
                Active Calls
              </h2>
              <button
                onClick={getActiveCalls}
                disabled={!socketConnected}
                className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>

            {/* Loading State */}
            {!socketConnected && (
              <div className="text-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-cyan-400 mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-slate-400">Connecting to server...</p>
              </div>
            )}

            {/* Empty State */}
            {socketConnected && activeCalls.length === 0 && (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No active calls
                </h3>
                <p className="text-slate-500 text-sm">
                  Start a new meeting to get started
                </p>
              </div>
            )}

            {/* Active Calls List */}
            {socketConnected && activeCalls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCalls.map((call) => (
                  <ActiveCallCard
                    key={call.callId}
                    call={call}
                    onJoin={handleJoinCall}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Call Lobby Modal */}
      <PreCallLobby
        isOpen={callStage === "precall"}
        localStream={localStream}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isInitializing={mediaLoading || !localPeerId}
        error={mediaError}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onJoinCall={handlePreCallReady}
        onCancel={handleCancelPreCall}
      />
    </div>
  );
}

export default VideoPage;
