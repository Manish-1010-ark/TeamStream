// frontend/src/pages/workspace/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

function ChatPage() {
  const { workspaceSlug } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null); // Use a ref to hold the socket instance across re-renders

  // Helper to get the auth token for API calls
  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    // In a real app, you'd also handle token expiration here
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  // Main effect for setting up the chat room
  useEffect(() => {
    // Get the current user from session storage
    const session = JSON.parse(localStorage.getItem("session"));
    if (session?.user) {
      setUser(session.user);
    }

    // Create the socket connection when the component mounts
    socketRef.current = io("http://localhost:3001");
    const socket = socketRef.current;

    // Fetch initial chat history from the API
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3001/api/workspaces/${workspaceSlug}/messages`,
          { headers: getAuthHeader() }
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchMessages();

    // Tell the server which workspace room to join
    socket.emit("join_workspace", workspaceSlug);

    // Set up a listener for new incoming messages
    socket.on("new_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.off("new_message");
      socket.disconnect();
    };
  }, [workspaceSlug]); // This effect re-runs if you navigate to a different workspace

  // Effect to automatically scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handler for submitting the message form
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user && socketRef.current) {
      // Send the new message to the server via the socket
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
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <header className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Team Chat</h1>
        <p className="text-sm text-slate-400">
          Real-time messaging for your workspace
        </p>
      </header>

      {/* Message Display Area */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender_id === user?.id ? "justify-end" : ""
            }`}
          >
            {/* Show avatar for other users' messages */}
            {msg.sender_id !== user?.id && (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold">
                {msg.display_name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div
              className={`p-4 rounded-xl max-w-lg ${
                msg.sender_id === user?.id
                  ? "bg-cyan-600 rounded-br-none"
                  : "bg-slate-800 rounded-bl-none"
              }`}
            >
              <p className="font-bold text-sm mb-1 text-cyan-300">
                {msg.display_name || "Anonymous"}
              </p>
              <p className="text-slate-200 whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="text-xs text-slate-400 text-right mt-2">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <footer className="p-6 border-t border-slate-800 bg-slate-950">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

export default ChatPage;
