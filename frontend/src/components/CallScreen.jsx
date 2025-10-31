// frontend/src/components/CallScreen.jsx
import React from "react";
import VideoPlayer from "./VideoPlayer";

/**
 * CallScreen - Full-screen Google Meet-style video call interface
 * NOW: Pure presentation component
 * Receives ALL state from parent (VideoPage)
 *
 * @param {string} callId - ID of the call
 * @param {string} workspaceSlug - Current workspace
 * @param {string} userId - Current user's ID
 * @param {string} userName - Current user's name
 * @param {MediaStream} localStream - Persistent stream from parent
 * @param {string} localPeerId - Persistent peer ID from parent
 * @param {Map} remoteStreams - Map of remote streams from parent
 * @param {Map} connectionStates - Map of connection states from parent
 * @param {boolean} isAudioEnabled - Audio track state
 * @param {boolean} isVideoEnabled - Video track state
 * @param {function} onToggleAudio - Handler for audio toggle
 * @param {function} onToggleVideo - Handler for video toggle
 * @param {function} onLeave - Callback when user leaves call
 */
function CallScreen({
  callId,
  workspaceSlug,
  userId,
  userName,
  localStream,
  localPeerId,
  remoteStreams,
  connectionStates,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
}) {
  /**
   * Get grid layout classes based on participant count
   */
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

  console.log("🎥 [CALL SCREEN] Render:", {
    callId,
    localPeerId,
    hasLocalStream: !!localStream,
    remoteStreamsCount: remoteStreams?.size || 0,
    totalParticipants,
  });

  return (
    <div className="fixed inset-0 bg-slate-950 z-50">
      {/* ✅ Full-screen video grid */}
      <div className="h-full w-full p-4">
        <div
          className={`grid ${getGridClasses()} gap-3 h-full max-w-7xl mx-auto`}
        >
          {/* Local Video */}
          <div className="relative min-h-0">
            <VideoPlayer
              stream={localStream}
              isLocal={true}
              userName={userName}
              isMuted={!isAudioEnabled}
              isVideoOff={!isVideoEnabled}
            />
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams?.entries() || []).map(
            ([peerId, { stream, userName: remoteUserName }]) => {
              const connectionState = connectionStates?.get(peerId);
              const hasVideo = stream?.getVideoTracks()[0]?.enabled;

              return (
                <div key={peerId} className="relative min-h-0">
                  <VideoPlayer
                    stream={stream}
                    isLocal={false}
                    userName={remoteUserName}
                    isMuted={false}
                    isVideoOff={!hasVideo}
                  />

                  {/* Connection State Overlay */}
                  {connectionState !== "connected" && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
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
                            <div className="text-red-400 text-4xl mb-2">⚠️</div>
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
      </div>

      {/* ✅ Floating Header - Top */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Call Info - Left */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 px-4 py-2.5 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-100 text-sm font-semibold">
                {workspaceSlug}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 text-sm font-medium">
                {totalParticipants}{" "}
                {totalParticipants === 1 ? "participant" : "participants"}
              </span>
            </div>
          </div>

          {/* Status Indicators - Right */}
          <div className="flex items-center gap-2">
            {/* Connecting Indicator */}
            {connectedPeers < (remoteStreams?.size || 0) && (
              <div className="flex items-center gap-2 bg-amber-500/10 backdrop-blur-md border border-amber-500/30 px-3 py-2 rounded-lg shadow-lg">
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
                <span className="text-amber-400 text-xs font-medium">
                  Connecting...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Floating Controls - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-center gap-3">
              {/* Mute/Unmute Button */}
              <button
                onClick={onToggleAudio}
                className={`p-4 rounded-full transition-all ${
                  !isAudioEnabled
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                title={
                  !isAudioEnabled ? "Unmute microphone" : "Mute microphone"
                }
              >
                {!isAudioEnabled ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </button>

              {/* Video On/Off Button */}
              <button
                onClick={onToggleVideo}
                className={`p-4 rounded-full transition-all ${
                  !isVideoEnabled
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                title={!isVideoEnabled ? "Turn on camera" : "Turn off camera"}
              >
                {!isVideoEnabled ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                )}
              </button>

              {/* Hang Up Button */}
              <button
                onClick={onLeave}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
                title="Leave call"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  <line x1="23" y1="1" x2="17" y2="7"></line>
                  <line x1="17" y1="1" x2="23" y2="7"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallScreen;
