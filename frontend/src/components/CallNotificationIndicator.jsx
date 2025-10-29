// frontend/src/components/CallNotificationIndicator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

/**
 * CallNotificationIndicator - Shows active call status and allows quick join
 * Displays across all workspace pages (except video page itself)
 */
function CallNotificationIndicator() {
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const location = useLocation();
  const socketRef = useRef(null);
  
  const [participantsInCall, setParticipantsInCall] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Don't show on video page
  const isOnVideoPage = location.pathname.includes('/video');

  useEffect(() => {
    if (!workspaceSlug || isOnVideoPage) return;

    // Connect to socket
    socketRef.current = io('http://localhost:3001');
    
    // Request current call status
    const requestCallStatus = () => {
      socketRef.current.emit('get_call_status', { workspaceSlug });
    };

    // Listen for call status updates
    socketRef.current.on('call_status', ({ participants }) => {
      setParticipantsInCall(participants || []);
      setIsVisible(participants && participants.length > 0);
    });

    // Listen for users joining call
    socketRef.current.on('user_joined_call', ({ socketId, userId, userName }) => {
      setParticipantsInCall(prev => {
        // Avoid duplicates
        if (prev.some(p => p.socketId === socketId)) return prev;
        return [...prev, { socketId, userId, userName }];
      });
      setIsVisible(true);
    });

    // Listen for users leaving call
    socketRef.current.on('user_left_call', ({ socketId }) => {
      setParticipantsInCall(prev => {
        const updated = prev.filter(p => p.socketId !== socketId);
        if (updated.length === 0) {
          setIsVisible(false);
          setIsExpanded(false);
        }
        return updated;
      });
    });

    // Request initial status
    requestCallStatus();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [workspaceSlug, isOnVideoPage]);

  if (!isVisible || isOnVideoPage) return null;

  const handleJoinCall = () => {
    navigate(`/workspace/${workspaceSlug}/video`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed State - Floating Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-full shadow-lg p-4 flex items-center gap-3 transition-all hover:scale-105 animate-pulse"
        >
          <div className="relative">
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
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {participantsInCall.length}
            </span>
          </div>
          <span className="font-semibold">
            Call in progress
          </span>
        </button>
      )}

      {/* Expanded State - Card */}
      {isExpanded && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-80 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-slate-100">Active Call</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Participants List */}
          <div className="p-4">
            <p className="text-slate-400 text-sm mb-3">
              {participantsInCall.length} {participantsInCall.length === 1 ? 'person' : 'people'} in call
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {participantsInCall.map((participant, index) => (
                <div
                  key={participant.socketId || index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-semibold text-sm">
                      {participant.userName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-slate-200 text-sm font-medium truncate">
                    {participant.userName || 'Unknown User'}
                  </span>
                </div>
              ))}
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinCall}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
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
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              Join Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallNotificationIndicator;