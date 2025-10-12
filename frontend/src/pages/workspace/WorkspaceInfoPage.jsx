// frontend/src/pages/workspace/WorkspaceInfoPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CopyButton from "../../components/CopyButton";

function WorkspaceInfoPage() {
  const { workspaceSlug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { headers: getAuthHeader() };
        const [wsRes, membersRes] = await Promise.all([
          axios.get(
            `http://localhost:3001/api/workspaces/${workspaceSlug}`,
            headers
          ),
          axios.get(
            `http://localhost:3001/api/workspaces/${workspaceSlug}/members`,
            headers
          ),
        ]);
        setWorkspace(wsRes.data);
        setMembers(membersRes.data);
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {workspace.name}
            </h1>
          </div>
          <p className="text-slate-400 text-base ml-4">
            Details and members of your workspace
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
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 font-medium">Workspace ID:</span>
              <span className="font-mono bg-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2 text-slate-200">
                {workspace.id} <CopyButton textToCopy={workspace.id} />
              </span>
            </div>
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

        {/* Members Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Members ({members.length})
          </h2>
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                    {member.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      {member.username}
                    </p>
                    <p className="text-sm text-slate-400">{member.email}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
