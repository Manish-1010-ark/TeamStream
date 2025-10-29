// frontend/src/pages/workspace/VideoPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "../../components/VideoPlayer";
import CallControls from "../../components/CallControls";
import useUserMedia from "../../hooks/useUserMedia";
import useSocketSignaling from "../../hooks/useSocketSignaling";
import usePeerJSConnections from "../../hooks/usePeerJSConnections";

function VideoPage() {
  const { workspaceSlug } = useParams();

  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [callState, setCallState] = useState("lobby");
  const [error, setError] = useState(null);

  // Step 1: Get local media stream
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

  // Step 2: Initialize Socket.IO signaling
  const {
    isConnected: socketConnected,
    participants,
    joinVideoRoom,
    leaveVideoRoom,
  } = useSocketSignaling(workspaceSlug, userId, userName);

  // Step 3: Initialize PeerJS with participants from socket
  // ✅ CRITICAL FIX: Use participants from socket, not empty Map
  const {
    localPeerId,
    remoteStreams,
    connectionStates,
    initializePeer,
    cleanupPeer,
  } = usePeerJSConnections(localStream, participants);

  // Load user info from session
  useEffect(() => {
    console.log("🚀 VideoPage mounted");

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
        console.log(`👤 User info loaded: ${uname} (${uid})`);
      } else {
        console.warn("⚠️ No user session found");
        setError("User session not found. Please log in.");
      }
    } catch (err) {
      console.error("❌ Error loading user session:", err);
      setError("Failed to load user session.");
    }
  }, []);

  /**
   * ✅ Join room when localPeerId becomes available
   * CRITICAL: This needs to update the socket signaling hook with the peer ID
   */
  useEffect(() => {
    if (
      callState === "in-call" &&
      localPeerId &&
      socketConnected &&
      userId &&
      userName
    ) {
      console.log("✅ All requirements met, joining video room...");
      console.log(`   - Peer ID: ${localPeerId}`);
      console.log(`   - User: ${userName} (${userId})`);

      // Manually emit join with peer ID since we initialized socket with null
      // We need to call joinVideoRoom but with the peer ID
      // The socket hook needs to be updated to accept peer ID updates
      joinVideoRoom(localPeerId);
    }
  }, [
    localPeerId,
    callState,
    socketConnected,
    userId,
    userName,
    joinVideoRoom,
  ]);

  const handleJoinCall = async () => {
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

    console.log("🎬 Starting call join sequence...");
    setCallState("connecting");
    setError(null);

    try {
      console.log("📹 Step 1: Starting local media...");
      await startMedia();
      console.log("✅ Step 1 complete: Local media started");

      console.log("🔷 Step 2: Initializing PeerJS and waiting for Peer ID...");
      const peerId = await initializePeer();
      console.log(`✅ Step 2 complete: PeerJS initialized with ID: ${peerId}`);

      console.log("✅ Step 3: Transitioning to in-call state");
      setCallState("in-call");

      console.log("✅ Successfully completed call join sequence");
    } catch (err) {
      console.error("❌ Failed to join call:", err);
      setError(err.message || "Failed to join call. Please try again.");
      setCallState("lobby");
      stopMedia();
      cleanupPeer();
    }
  };

  const handleLeaveCall = () => {
    console.log("👋 Leaving call...");
    leaveVideoRoom();
    cleanupPeer();
    stopMedia();
    setCallState("lobby");
    setError(null);
    console.log("✅ Left call successfully");
  };

  const getGridClasses = () => {
    const totalParticipants = (remoteStreams?.size || 0) + 1;
    if (totalParticipants === 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2 grid-rows-2";
    if (totalParticipants <= 6) return "grid-cols-3 grid-rows-2";
    return "grid-cols-3 grid-rows-3";
  };

  const totalParticipants = (remoteStreams?.size || 0) + 1;
  const connectedPeers = Array.from(connectionStates?.values() || []).filter(
    (state) => state === "connected"
  ).length;

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Video Conference
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {workspaceSlug && `Workspace: ${workspaceSlug}`}
            </p>
          </div>

          {callState === "in-call" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm font-medium">
                  {totalParticipants}{" "}
                  {totalParticipants === 1 ? "participant" : "participants"}
                </span>
              </div>

              {connectedPeers < (remoteStreams?.size || 0) && (
                <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/30">
                  <svg
                    className="animate-spin h-4 w-4 text-amber-400"
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
                  <span className="text-amber-400 text-sm">
                    Connecting to peers...
                  </span>
                </div>
              )}

              {!socketConnected && (
                <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
                  <svg
                    className="h-4 w-4 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-red-400 text-sm">Reconnecting...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {callState === "lobby" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-slate-900 rounded-lg p-8 border border-slate-800 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-cyan-400"
                  >
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect
                      x="1"
                      y="5"
                      width="15"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Ready to join?
                </h2>
                <p className="text-slate-400 text-sm">
                  Join the video call with your team members in this workspace.
                </p>
              </div>

              {(error || mediaError) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex items-start gap-2">
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
                    <p className="text-red-400 text-sm">
                      {error || mediaError}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleJoinCall}
                disabled={!userId || !userName || !socketConnected}
                className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-500 font-semibold rounded-lg transition-colors"
              >
                {!socketConnected
                  ? "Connecting to server..."
                  : !userId || !userName
                  ? "Loading user info..."
                  : "Join Call"}
              </button>

              <div className="mt-4 text-center">
                <p className="text-slate-500 text-xs">
                  Make sure your camera and microphone are enabled
                </p>
                {!socketConnected && (
                  <p className="text-amber-400 text-xs mt-2">
                    Waiting for server connection...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {callState === "connecting" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-cyan-400 mx-auto mb-4"
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
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Connecting to call...
              </h2>
              <p className="text-slate-400 text-sm">
                {mediaLoading && "Requesting camera and microphone access..."}
                {!mediaLoading &&
                  localStream &&
                  !localPeerId &&
                  "Initializing connection..."}
                {localPeerId && "Joining video room..."}
              </p>
              <button
                onClick={handleLeaveCall}
                className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {callState === "in-call" && (
          <>
            <div className="flex-1 overflow-auto p-6">
              <div
                className={`grid ${getGridClasses()} gap-4 max-w-7xl mx-auto h-full`}
              >
                <div className="relative">
                  <VideoPlayer
                    stream={localStream}
                    isLocal={true}
                    userName={userName}
                    isMuted={!isAudioEnabled}
                    isVideoOff={!isVideoEnabled}
                  />
                </div>

                {Array.from(remoteStreams?.entries() || []).map(
                  ([peerId, { stream, userName: remoteUserName }]) => {
                    const connectionState = connectionStates?.get(peerId);
                    const hasVideo = stream?.getVideoTracks()[0]?.enabled;

                    return (
                      <div key={peerId} className="relative">
                        <VideoPlayer
                          stream={stream}
                          isLocal={false}
                          userName={remoteUserName}
                          isMuted={false}
                          isVideoOff={!hasVideo}
                        />

                        {connectionState !== "connected" && (
                          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg">
                            <div className="text-center">
                              {connectionState === "connecting" && (
                                <>
                                  <svg
                                    className="animate-spin h-8 w-8 text-cyan-400 mx-auto mb-2"
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
                                  <p className="text-slate-300 text-sm">
                                    Connecting...
                                  </p>
                                </>
                              )}
                              {connectionState === "error" && (
                                <>
                                  <div className="text-red-400 text-4xl mb-2">
                                    ⚠️
                                  </div>
                                  <p className="text-red-400 text-sm">
                                    Connection failed
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Total Participants</p>
                    <p className="text-slate-200 font-semibold">
                      {totalParticipants}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Connected Peers</p>
                    <p className="text-slate-200 font-semibold">
                      {connectedPeers} / {remoteStreams?.size || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Local Stream</p>
                    <p className="text-slate-200 font-semibold">
                      {localStream ? "✅ Active" : "❌ Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Socket Status</p>
                    <p className="text-slate-200 font-semibold">
                      {socketConnected ? "✅ Connected" : "❌ Disconnected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Peer ID</p>
                    <p className="text-slate-200 font-semibold text-xs">
                      {localPeerId ? `${localPeerId.slice(0, 8)}...` : "N/A"}
                    </p>
                  </div>
                </div>

                {remoteStreams && remoteStreams.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-slate-500 text-xs mb-2">
                      Remote Connections:
                    </p>
                    <div className="space-y-1">
                      {Array.from(remoteStreams?.entries() || []).map(
                        ([peerId, { userName: remoteUserName }]) => {
                          const state =
                            connectionStates?.get(peerId) || "unknown";
                          return (
                            <div
                              key={peerId}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-400">
                                {remoteUserName} ({peerId.slice(0, 8)}...)
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  state === "connected"
                                    ? "bg-green-500/20 text-green-400"
                                    : state === "error"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {state}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <CallControls
                isMuted={!isAudioEnabled}
                isVideoOff={!isVideoEnabled}
                onToggleMute={toggleAudio}
                onToggleVideo={toggleVideo}
                onHangUp={handleLeaveCall}
                participantCount={totalParticipants}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VideoPage;
