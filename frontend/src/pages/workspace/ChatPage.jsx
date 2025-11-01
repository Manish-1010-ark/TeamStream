// frontend/src/pages/workspace/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import InlineCallBanner from "../../components/InlineCallBanner";

const API_URL = import.meta.env.VITE_API_URL;

function ChatPage() {
  const { workspaceSlug } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  // Socket and initial data fetch
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (session?.user) {
      setUser(session.user);
    }

    // Create socket connection
    socketRef.current = io(API_URL);
    const socket = socketRef.current;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/api/workspaces/${workspaceSlug}/messages`,
          { headers: getAuthHeader() }
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchMessages();

    // Join workspace room
    socket.emit("join_workspace", workspaceSlug);

    // Listen for new messages
    socket.on("new_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup
    return () => {
      socket.off("new_message");
      socket.disconnect();
    };
  }, [workspaceSlug]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user && socketRef.current) {
      socketRef.current.emit("send_message", {
        content: newMessage,
        workspaceSlug: workspaceSlug,
        userId: user.id,
        userName: user.user_metadata?.display_name || user.email.split("@")[0],
      });
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative p-6 border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30 flex-shrink-0 z-10 overflow-hidden">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-7 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Team Chat
          </h1>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <p className="text-sm text-slate-400">
            Real-time messaging for your workspace
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-6 space-y-4">
          {/* Call Banner - Shows prominently when call is active */}
          <InlineCallBanner />

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <svg
                className="w-16 h-16 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-slate-500 text-lg">No messages yet</p>
              <p className="text-slate-600 text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const showAvatar = !isOwnMessage;
              const prevMsg = messages[index - 1];
              const showHeader =
                !prevMsg || prevMsg.sender_id !== msg.sender_id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 animate-message-in ${
                    isOwnMessage ? "justify-end" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  {showAvatar && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-cyan-500/20">
                      {msg.display_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="flex flex-col max-w-lg">
                    {showHeader && (
                      <p
                        className={`text-xs font-semibold mb-1 px-1 ${
                          isOwnMessage
                            ? "text-right text-cyan-400"
                            : "text-slate-400"
                        }`}
                      >
                        {msg.display_name || "Anonymous"}
                      </p>
                    )}
                    <div
                      className={`group relative p-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${
                        isOwnMessage
                          ? "bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-br-md hover:from-cyan-500 hover:to-cyan-600"
                          : "bg-slate-800/80 backdrop-blur-sm rounded-bl-md hover:bg-slate-800 border border-slate-700/50"
                      }`}
                    >
                      <p className="text-slate-50 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-2 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <p className="text-xs text-slate-400 opacity-70 group-hover:opacity-100 transition-opacity">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isOwnMessage && (
                          <svg
                            className="w-4 h-4 text-cyan-300 opacity-70"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {isOwnMessage && <div className="w-10 flex-shrink-0"></div>}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <footer className="relative p-6 border-t border-slate-800/50 backdrop-blur-sm bg-slate-900/30 flex-shrink-0 z-10">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-grow relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-5 py-3.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all duration-200 shadow-lg"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none flex items-center gap-2"
          >
            <span>Send</span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message-in {
          animation: message-in 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
      `}</style>
    </div>
  );
}

export default ChatPage;
