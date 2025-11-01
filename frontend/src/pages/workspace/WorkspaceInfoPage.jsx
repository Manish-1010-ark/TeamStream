// frontend/src/pages/workspace/WorkspaceInfoPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CopyButton from "../../components/CopyButton";
import { useWorkspacePresence } from "../../hooks/useWorkspacePresence"; // Import the hook

const API_URL = import.meta.env.VITE_API_URL;

function WorkspaceInfoPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Use the custom hook - replaces all socket state and logic
  const { onlineUsers, isUserOnline, isConnected, currentUserId } =
    useWorkspacePresence(workspaceSlug);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  // Handle leave workspace
  const handleLeaveWorkspace = async () => {
    const confirmation = window.confirm(
      `Are you sure you want to leave "${workspace?.name}"?\n\nThis action is irreversible. You will need to be re-invited to rejoin this workspace.`
    );

    if (!confirmation) return;

    try {
      const headers = { headers: getAuthHeader() };
      await axios.delete(
        `${API_URL}/api/workspaces/${workspaceSlug}/leave`,
        headers
      );

      // Show success message
      alert(`You have successfully left "${workspace?.name}"`);

      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to leave workspace:", error);

      if (error.response?.status === 403) {
        alert(
          "You cannot leave this workspace because you are the owner. Please delete the workspace or transfer ownership first."
        );
      } else {
        alert(
          `Failed to leave workspace: ${
            error.response?.data?.error || "Unknown error"
          }`
        );
      }
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const session = JSON.parse(localStorage.getItem("session"));
        const userId = session?.user?.id;

        const headers = { headers: getAuthHeader() };
        const [wsRes, membersRes] = await Promise.all([
          axios.get(`${API_URL}/api/workspaces/${workspaceSlug}`, headers),
          axios.get(
            `${API_URL}/api/workspaces/${workspaceSlug}/members`,
            headers
          ),
        ]);

        setWorkspace(wsRes.data);
        setMembers(membersRes.data);

        // Check if current user is the owner
        if (userId && wsRes.data.owner_id === userId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Failed to fetch workspace info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workspaceSlug]);

  // Keep your existing fetchMembers function
  const fetchMembers = async () => {
    try {
      const headers = { headers: getAuthHeader() };
      const membersRes = await axios.get(
        `${API_URL}/api/workspaces/${workspaceSlug}/members`,
        headers
      );
      setMembers(membersRes.data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const session = JSON.parse(localStorage.getItem("session"));
        const userId = session?.user?.id;

        const headers = { headers: getAuthHeader() };
        const [wsRes, membersRes] = await Promise.all([
          axios.get(`${API_URL}/api/workspaces/${workspaceSlug}`, headers),
          axios.get(
            `${API_URL}/api/workspaces/${workspaceSlug}/members`,
            headers
          ),
        ]);

        setWorkspace(wsRes.data);
        setMembers(membersRes.data);

        // Check if current user is the owner
        if (userId && wsRes.data.owner_id === userId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Failed to fetch workspace info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workspaceSlug]);

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">
            Loading workspace info...
          </p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md">
          <p className="text-red-300">Could not load workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {workspace.name}
              </h1>
            </div>

            {/* Leave Workspace Button (only if not owner) */}
            {!isOwner && (
              <button
                onClick={handleLeaveWorkspace}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 hover:border-red-500 text-red-400 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Leave Workspace
              </button>
            )}
          </div>
          <p className="text-slate-400 text-base ml-4">
            Workspace details, members, and activity
          </p>
        </header>

        {/* Workspace Details Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 mb-6 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Workspace Details
          </h2>
          <div className="space-y-3 text-sm">
            {/* Owner Information */}
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 font-medium">Created by:</span>
              <span className="text-slate-200 font-semibold">
                {workspace.owner_name}
                {isOwner && (
                  <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30">
                    You
                  </span>
                )}
              </span>
            </div>

            {/* Creation Date */}
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 font-medium">Created on:</span>
              <span className="text-slate-200">
                {formatDate(workspace.created_at)}
              </span>
            </div>

            {/* Workspace ID */}
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 font-medium">Workspace ID:</span>
              <span className="font-mono bg-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2 text-slate-200">
                {workspace.id} <CopyButton textToCopy={workspace.id} />
              </span>
            </div>

            {/* Workspace Slug */}
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 font-medium">
                Workspace Slug:
              </span>
              <span className="font-mono bg-slate-700 px-3 py-1.5 rounded-md text-slate-200">
                {workspace.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Members Card with Real-time Presence */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Members ({members.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {onlineUsers.size} online
            </div>
          </div>
          <ul className="space-y-3">
            {members.map((member) => {
              const online = isUserOnline(member.id);
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with online indicator */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        {member.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      {/* Online/Offline Indicator */}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-700 ${
                          online ? "bg-green-500 animate-pulse" : "bg-slate-500"
                        }`}
                        title={online ? "Online" : "Offline"}
                      ></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-200">
                          {member.username}
                        </p>
                        {member.id === workspace.owner_id && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            Owner
                          </span>
                        )}
                        {member.id === currentUserId && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {member.id === currentUserId ? "You" : "Member"}
                      </p>
                    </div>
                  </div>
                  {/* Status Text */}
                  <span
                    className={`text-xs font-medium ${
                      online ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {online ? "Online" : "Offline"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <p className="text-slate-400 text-sm">
            <strong>Debug Info:</strong> Connected: {isConnected ? "Yes" : "No"}
            , Online Users: {Array.from(onlineUsers).join(", ") || "None"}
          </p>
        </div>

        {/* Owner Warning (if user is owner) */}
        {isOwner && (
          <div className="mt-6 bg-purple-500/10 border border-purple-500/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-purple-300 font-medium mb-1">
                  You are the owner of this workspace
                </p>
                <p className="text-purple-400/80 text-sm">
                  As the owner, you cannot leave this workspace. To remove
                  yourself, you must either delete the workspace or transfer
                  ownership to another member first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default WorkspaceInfoPage;
