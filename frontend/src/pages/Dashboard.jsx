// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, LogOut, Users, ArrowRight } from "lucide-react";

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
  const [error, setError] = useState("");

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
      setError("");
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
      setError("Failed to load workspaces. Please try again.");
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
    setError("");
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
      setError("Could not create workspace. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinWorkspaceId.trim()) return;

    setJoinLoading(true);
    setError("");
    try {
      await axios.post(
        `${API_URL}/api/workspaces/join`,
        { workspace_id: joinWorkspaceId },
        { headers: getAuthHeader() }
      );
      setJoinWorkspaceId("");
      fetchWorkspaces();
      setError(""); // Clear any previous errors
      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className =
        "fixed top-4 right-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl z-50 animate-fade-in";
      successMsg.textContent = "Successfully joined workspace!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
      console.error("Failed to join workspace", error);
      setError(
        error.response?.data?.error ||
          "Could not join workspace. Please check the ID and try again."
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
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                TeamStream
              </h1>
            </div>
            <p className="text-sm text-slate-400 ml-13">
              Welcome back,{" "}
              <span className="text-cyan-400 font-medium">{userName}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200 font-medium group"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-300 hover:text-red-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Your Workspaces Section */}
        <section className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-100">
              Your Workspaces
            </h2>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-xl">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-slate-800/50 rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            ) : workspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((ws, index) => (
                  <button
                    key={ws.slug}
                    onClick={() => handleOpenWorkspace(ws.slug)}
                    className="group p-6 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all text-left shadow-lg hover:shadow-cyan-500/20 animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all">
                        <span className="text-white font-bold text-xl">
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 group-hover:bg-cyan-500/20 flex items-center justify-center transition-all">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 group-hover:text-cyan-300 transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Click to open workspace
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No workspaces yet
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Create a new workspace or join an existing one to get started
                  with your team
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Create and Join Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Workspace */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-100">
                Create Workspace
              </h2>
            </div>
            <form
              onSubmit={handleCreateWorkspace}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-xl"
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Team, Project Apollo"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all"
                  disabled={createLoading}
                />
              </div>
              <button
                type="submit"
                disabled={createLoading || !newWorkspaceName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {createLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Create Workspace</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Join Workspace */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-100">
                Join Workspace
              </h2>
            </div>
            <form
              onSubmit={handleJoinWorkspace}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-xl"
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Workspace ID
                </label>
                <input
                  type="text"
                  placeholder="Enter workspace ID or invite code"
                  value={joinWorkspaceId}
                  onChange={(e) => setJoinWorkspaceId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all"
                  disabled={joinLoading}
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ask your team admin for the workspace ID
                </p>
              </div>
              <button
                type="submit"
                disabled={joinLoading || !joinWorkspaceId.trim()}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {joinLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    <span>Join Workspace</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
