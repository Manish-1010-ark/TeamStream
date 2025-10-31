// frontend/src/components/PreCallLobby.jsx
import React from "react";

/**
 * PreCallLobby - Device check and setup before joining call
 * NOW: Only handles UI - does NOT manage media lifecycle
 * Media is managed by parent (VideoPage)
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {MediaStream} localStream - Local media stream from parent
 * @param {boolean} isAudioEnabled - Audio track enabled state
 * @param {boolean} isVideoEnabled - Video track enabled state
 * @param {boolean} isInitializing - Whether media/peer is still initializing
 * @param {string} error - Error message if any
 * @param {function} onToggleAudio - Handler for audio toggle
 * @param {function} onToggleVideo - Handler for video toggle
 * @param {function} onJoinCall - Callback when user clicks "Join Now"
 * @param {function} onCancel - Callback when user cancels
 */
function PreCallLobby({
  isOpen,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  isInitializing,
  error,
  onToggleAudio,
  onToggleVideo,
  onJoinCall,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-slate-100">Ready to join?</h2>
          <p className="text-slate-400 mt-1">
            Check your camera and microphone before joining
          </p>
        </div>

        {/* Video Preview */}
        <div className="p-6">
          <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-700">
            {/* Initializing State */}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center">
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
                  <p className="text-slate-400 text-sm">
                    Requesting camera and microphone...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isInitializing && !localStream && error && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-400"
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
                  </div>
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                  <p className="text-slate-500 text-xs">
                    Please check your browser permissions and try again
                  </p>
                </div>
              </div>
            )}

            {/* Video Off State */}
            {localStream && !isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-12 h-12 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">Camera is off</p>
                </div>
              </div>
            )}

            {/* Video Preview */}
            {localStream && isVideoEnabled && (
              <video
                ref={(videoEl) => {
                  if (videoEl && localStream) {
                    videoEl.srcObject = localStream;
                    videoEl.play().catch(console.error);
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Controls Overlay */}
            {localStream && !isInitializing && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                {/* Microphone Toggle */}
                <button
                  onClick={onToggleAudio}
                  className={`p-4 rounded-full transition-all ${
                    isAudioEnabled
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                  {isAudioEnabled ? (
                    <svg
                      width="20"
                      height="20"
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
                  ) : (
                    <svg
                      width="20"
                      height="20"
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
                  )}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={onToggleVideo}
                  className={`p-4 rounded-full transition-all ${
                    isVideoEnabled
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoEnabled ? (
                    <svg
                      width="20"
                      height="20"
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
                  ) : (
                    <svg
                      width="20"
                      height="20"
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
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onJoinCall}
            disabled={isInitializing || !localStream || error}
            className="px-8 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-500 font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {isInitializing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                <span>Connecting...</span>
              </>
            ) : (
              <span>Join Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreCallLobby;
