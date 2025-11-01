// frontend/src/components/InlineCallBanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * InlineCallBanner - Shows a banner at the top of pages when a call is active
 * Can be placed inside any workspace page (e.g., ChatPage)
 */
function InlineCallBanner() {
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const socketRef = useRef(null);
  
  const [participantCount, setParticipantCount] = useState(0);
  const [participantNames, setParticipantNames] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;

    // Connect to socket
    socketRef.current = io(API_URL);
    
    // Request current call status
    const requestCallStatus = () => {
      socketRef.current.emit('get_call_status', { workspaceSlug });
    };

    // Listen for call status updates
    socketRef.current.on('call_status', ({ participants }) => {
      if (participants && participants.length > 0) {
        setParticipantCount(participants.length);
        setParticipantNames(participants.map(p => p.userName));
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });

    // Listen for users joining call
    socketRef.current.on('user_joined_call', ({ userName }) => {
      setParticipantCount(prev => prev + 1);
      setParticipantNames(prev => [...prev, userName]);
      setIsVisible(true);
    });

    // Listen for users leaving call
    socketRef.current.on('user_left_call', () => {
      // Re-request status for accurate count
      requestCallStatus();
    });

    // Request initial status
    requestCallStatus();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [workspaceSlug]);

  if (!isVisible) return null;

  const handleJoinCall = () => {
    navigate(`/workspace/${workspaceSlug}/video`);
  };

  const displayNames = participantNames.slice(0, 3).join(', ');
  const remainingCount = participantCount - 3;

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30 rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-cyan-500 text-slate-900 rounded-full p-3">
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
            </div>
          </div>

          {/* Call Info */}
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Video call in progress
            </h3>
            <p className="text-slate-300 text-sm">
              {displayNames}
              {remainingCount > 0 && ` and ${remainingCount} more`}
              {' '}
              {participantCount === 1 ? 'is' : 'are'} in the call
            </p>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoinCall}
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg transition-all flex items-center gap-2 hover:scale-105"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
          </svg>
          Join Call
        </button>
      </div>
    </div>
  );
}

export default InlineCallBanner;