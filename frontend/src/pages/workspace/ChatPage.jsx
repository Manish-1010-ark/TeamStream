// frontend/src/pages/workspace/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import InlineCallBanner from "../../components/videocall/InlineCallBanner";

const API_URL = import.meta.env.VITE_API_URL;

function ChatPage() {
  const { workspaceSlug } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
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
    } else {
      console.error("❌ No user session found");
      setError("Please log in to access chat");
      return;
    }

    console.log("🔌 [CHAT] Initializing Socket.IO connection...");
    console.log(`   API_URL: ${API_URL}`);
    console.log(`   Workspace: ${workspaceSlug}`);

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: false,
    });

    socketRef.current = socket;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        console.log("📥 [CHAT] Fetching initial messages...");
        const { data } = await axios.get(
          `${API_URL}/api/workspaces/${workspaceSlug}/messages`,
          { headers: getAuthHeader() }
        );
        console.log(`✅ [CHAT] Loaded ${data.length} messages`);
        setMessages(data);
        setError(null);
      } catch (error) {
        console.error("❌ [CHAT] Failed to fetch messages:", error);
        setError("Failed to load messages. Please refresh the page.");
      }
    };
    fetchMessages();

    // Socket event handlers
    socket.on("connect", () => {
      console.log("✅ [CHAT] Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);
      socket.emit("join_workspace", workspaceSlug);
      console.log(`📂 [CHAT] Joined workspace room: ${workspaceSlug}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [CHAT] Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [CHAT] Connection error:", err);
      setIsConnected(false);
      setError("Connection error. Retrying...");
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 [CHAT] Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setError(null);
      socket.emit("join_workspace", workspaceSlug);
    });

    socket.on("new_message", (message) => {
      console.log("💬 [CHAT] New message received:", message.id);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("message_error", ({ error: errMsg }) => {
      console.error("❌ [CHAT] Message error:", errMsg);
      setError(errMsg);
      setIsSending(false);
    });

    return () => {
      console.log("🧹 [CHAT] Cleaning up socket connection");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("reconnect");
      socket.off("new_message");
      socket.off("message_error");
      socket.disconnect();
    };
  }, [workspaceSlug]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      console.log("⚠️ [CHAT] Empty message, not sending");
      return;
    }

    if (!user) {
      console.error("❌ [CHAT] No user found");
      setError("Please log in to send messages");
      return;
    }

    if (!socketRef.current || !isConnected) {
      console.error("❌ [CHAT] Socket not connected");
      setError("Not connected to chat server. Please wait...");
      return;
    }

    setIsSending(true);
    setError(null);

    const messageData = {
      content: newMessage.trim(),
      workspaceSlug: workspaceSlug,
      userId: user.id,
    };

    console.log("📤 [CHAT] Sending message:", messageData);

    try {
      socketRef.current.emit("send_message", messageData);
      setNewMessage("");
      setIsSending(false);

      setTimeout(() => {
        if (isSending) {
          setError("Message taking too long to send. Please try again.");
          setIsSending(false);
        }
      }, 5000);
    } catch (err) {
      console.error("❌ [CHAT] Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setIsSending(false);
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
      <header className="relative p-6 border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Team Chat
          </h1>
        </div>
        <div className="ml-4 flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-slate-400 text-base">
                Real-time messaging for your workspace
              </p>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              <p className="text-yellow-400 text-base">
                Connecting to chat server...
              </p>
            </>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="relative bg-red-500/10 border-l-4 border-red-500 p-4 m-4 rounded-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
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
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-6 space-y-4">
          {/* Call Banner */}
          <InlineCallBanner />

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-slate-600"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                No messages yet
              </h3>
              <p className="text-slate-500 text-sm">
                Start the conversation with your team!
              </p>
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
                      className={`group relative p-4 rounded-2xl shadow-lg transition-all duration-200 ${
                        isOwnMessage
                          ? "bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-br-md hover:from-cyan-500 hover:to-cyan-600 hover:shadow-xl hover:shadow-cyan-500/10"
                          : "bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-bl-md hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl"
                      }`}
                    >
                      <p className="text-slate-50 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-2 opacity-70 group-hover:opacity-100 transition-opacity ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <p className="text-xs text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isOwnMessage && (
                          <svg
                            className="w-4 h-4 text-cyan-300"
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
              placeholder={
                isConnected ? "Type your message..." : "Connecting to chat..."
              }
              disabled={!isConnected || isSending}
              className="w-full px-5 py-3.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || isSending}
            className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none flex items-center gap-2"
          >
            {isSending ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
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
                <span>Sending...</span>
              </>
            ) : (
              <>
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
              </>
            )}
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

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
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
