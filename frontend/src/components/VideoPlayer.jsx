// frontend/src/components/VideoPlayer.jsx
import React, { useEffect, useRef } from "react";

/**
 * VideoPlayer component - Displays a video stream with user name overlay
 *
 * @param {MediaStream|null} stream - Media stream to display
 * @param {boolean} isLocal - Whether this is the local user's video
 * @param {string} userName - Display name of the user
 * @param {boolean} isMuted - Whether audio is muted
 * @param {boolean} isVideoOff - Whether video is disabled
 */
function VideoPlayer({ stream, isLocal, userName, isMuted, isVideoOff }) {
  const videoRef = useRef(null);

  /**
   * Update video element srcObject when stream changes
   * This is CRITICAL for fixing the remote video bug
   */
  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && stream) {
      console.log(
        `🎥 Setting video stream for ${userName} (${
          isLocal ? "local" : "remote"
        })`
      );
      console.log(
        `   Video tracks: ${stream.getVideoTracks().length}, Audio tracks: ${
          stream.getAudioTracks().length
        }`
      );

      // Set the stream as the video source
      videoElement.srcObject = stream;

      // Play the video (important for some browsers)
      videoElement.play().catch((err) => {
        console.error(`❌ Error playing video for ${userName}:`, err);
      });
    }

    // Cleanup function
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, userName, isLocal]); // Re-run when stream reference changes

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
      {/* Video Element */}
      {!isVideoOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent feedback
          className={`w-full h-full object-cover ${
            isLocal ? "scale-x-[-1]" : "" // Mirror local video
          }`}
        />
      ) : (
        // Placeholder when video is off
        <div className="w-full h-full flex items-center justify-center bg-slate-800">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-slate-400">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Camera off</p>
          </div>
        </div>
      )}

      {/* User Info Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/90 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium drop-shadow-lg">
              {userName}
              {isLocal && " (You)"}
            </span>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-2">
            {/* Muted indicator */}
            {isMuted && (
              <div className="bg-red-500/90 p-1.5 rounded-full">
                <svg
                  width="14"
                  height="14"
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
              </div>
            )}

            {/* Video off indicator */}
            {isVideoOff && (
              <div className="bg-red-500/90 p-1.5 rounded-full">
                <svg
                  width="14"
                  height="14"
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Local video indicator - Top Right */}
      {isLocal && (
        <div className="absolute top-3 right-3 bg-cyan-500/90 px-2 py-1 rounded text-xs font-semibold text-white">
          You
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
