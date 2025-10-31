// frontend/src/components/ActiveCallCard.jsx
import React from "react";

/**
 * ActiveCallCard - Display card for an active call in the lobby
 *
 * @param {Object} call - Call data { callId, creatorName, participantCount, createdAt }
 * @param {function} onJoin - Callback when join button is clicked
 */
function ActiveCallCard({ call, onJoin }) {
  const { callId, creatorName, participantCount, createdAt } = call;

  // Calculate time elapsed
  const getTimeElapsed = () => {
    const now = Date.now();
    const elapsed = now - createdAt;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-cyan-500/50 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {/* Active Indicator */}
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-slate-200 font-semibold">Active Call</h3>
          </div>

          <div className="space-y-1.5">
            {/* Creator */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>
                Started by{" "}
                <span className="text-slate-300 font-medium">
                  {creatorName}
                </span>
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {participantCount}{" "}
                {participantCount === 1 ? "participant" : "participants"}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{getTimeElapsed()}</span>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={() => onJoin(callId)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg transition-colors group-hover:scale-105 transform"
        >
          Join
        </button>
      </div>

      {/* Call ID (for debugging) */}
      <div className="pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-600 font-mono">
          ID: {callId.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}

export default ActiveCallCard;
