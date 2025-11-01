// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [joinWorkspaceId, setJoinWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [userName, setUserName] = useState("");

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchWorkspaces = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/workspaces`, {
        headers: getAuthHeader(),
      });
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (session) {
      setUserName(
        session.user?.user_metadata?.display_name ||
          session.user?.email?.split("@")[0] ||
          "User"
      );
    }
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreateLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/workspaces/create`,
        { name: newWorkspaceName },
        { headers: getAuthHeader() }
      );
      setNewWorkspaceName("");
      fetchWorkspaces();
      if (data.slug) {
        navigate(`/workspace/${data.slug}/chat`);
      }
    } catch (error) {
      console.error("Failed to create workspace", error);
      alert("Error: Could not create workspace.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinWorkspaceId.trim()) return;

    setJoinLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/workspaces/join`,
        { workspace_id: joinWorkspaceId },
        { headers: getAuthHeader() }
      );
      setJoinWorkspaceId("");
      fetchWorkspaces();
      alert("Successfully joined workspace!");
    } catch (error) {
      console.error("Failed to join workspace", error);
      alert(
        `Error: ${error.response?.data?.error || "Could not join workspace."}`
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleOpenWorkspace = (workspaceSlug) => {
    navigate(`/workspace/${workspaceSlug}/chat`);
  };

  const handleLogout = () => {
    localStorage.removeItem("session");
    navigate("/login");
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">TeamStream</h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, {userName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Your Workspaces Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-100">
            Your Workspaces
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-800 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : workspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((ws) => (
                  <button
                    key={ws.slug}
                    onClick={() => handleOpenWorkspace(ws.slug)}
                    className="p-6 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                        <span className="text-slate-900 font-bold text-lg">
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <svg
                        className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">
                      {ws.name}
                    </h3>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-slate-700 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-slate-400 text-lg">
                  You are not a member of any workspaces yet.
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Create a new workspace or join an existing one below.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Create and Join Workspace Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Workspace */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-slate-100">
              Create a New Workspace
            </h2>
            <form
              onSubmit={handleCreateWorkspace}
              className="bg-slate-900 border border-slate-800 rounded-xl p-8"
            >
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Team, Project Apollo"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none transition"
                  disabled={createLoading}
                />
              </div>
              <button
                type="submit"
                disabled={createLoading || !newWorkspaceName.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-slate-900 font-bold px-6 py-3 rounded-lg transition-all"
              >
                {createLoading ? "Creating..." : "Create Workspace"}
              </button>
            </form>
          </section>

          {/* Join Workspace */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-slate-100">
              Join an Existing Workspace
            </h2>
            <form
              onSubmit={handleJoinWorkspace}
              className="bg-slate-900 border border-slate-800 rounded-xl p-8"
            >
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Workspace ID
                </label>
                <input
                  type="text"
                  placeholder="Enter workspace ID or invite code"
                  value={joinWorkspaceId}
                  onChange={(e) => setJoinWorkspaceId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none transition"
                  disabled={joinLoading}
                />
              </div>
              <button
                type="submit"
                disabled={joinLoading || !joinWorkspaceId.trim()}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-all"
              >
                {joinLoading ? "Joining..." : "Join Workspace"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
