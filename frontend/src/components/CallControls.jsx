// frontend/src/components/CallControls.jsx
import React from 'react';

/**
 * CallControls component - Displays call control buttons
 * @param {boolean} isMuted - Whether microphone is muted
 * @param {boolean} isVideoOff - Whether camera is off
 * @param {Function} onToggleMute - Handler for mute toggle
 * @param {Function} onToggleVideo - Handler for video toggle
 * @param {Function} onHangUp - Handler for hanging up
 * @param {number} participantCount - Number of participants in call
 */
function CallControls({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onHangUp,
  participantCount = 1
}) {
  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Participant Count */}
        <div className="flex items-center gap-2 text-slate-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="text-sm font-medium">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute/Unmute Button */}
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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
                stroke="currentColor"
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
              isVideoOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            )}
          </button>

          {/* Hang Up Button */}
          <button
            onClick={onHangUp}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            title="Leave call"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
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

        {/* Empty space for symmetry */}
        <div className="w-32"></div>
      </div>
    </div>
  );
}

export default CallControls;