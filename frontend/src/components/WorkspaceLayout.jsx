// frontend/src/components/WorkspaceLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import IconChat from "./icons/IconChat";
import IconDocuments from "./icons/IconDocuments";
import IconTasks from "./icons/IconTasks";
import IconWhiteboard from "./icons/IconWhiteboard";
import IconVideo from "./icons/IconVideo";
import ProfileDropdown from "./ProfileDropdown";
import CopyButton from "./CopyButton"; // 1. IMPORT THE NEW COMPONENT

function WorkspaceLayout() {
  const navigate = useNavigate();
  const [workspaceId, setWorkspaceId] = useState(null); // <-- Add state for the ID
  const { workspaceSlug } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setLoading(true);
      try {
        // PERFORMANCE: Fetching only the current workspace data for efficiency.
        const { data: currentWorkspace } = await axios.get(
          `http://localhost:3001/api/workspaces/${workspaceSlug}`,
          { headers: getAuthHeader() }
        );
        setWorkspaceName(currentWorkspace.name);
        setWorkspaceId(currentWorkspace.id); // <-- Save the ID for the copy button

        const session = JSON.parse(localStorage.getItem("session"));
        if (session?.user) {
          setUserEmail(session.user.email || "user@example.com");
          setUserName(
            session.user?.user_metadata?.display_name ||
              session.user?.email?.split("@")[0] ||
              "User"
          );
        }
      } catch (error) {
        console.error("Failed to fetch workspace data", error);
        navigate("/dashboard"); // Redirect if workspace isn't found
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [workspaceSlug]);

  const handleLogout = () => {
    localStorage.removeItem("session");
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const navItems = [
    { path: "chat", icon: IconChat, label: "Chat" },
    { path: "documents", icon: IconDocuments, label: "Documents" },
    { path: "tasks", icon: IconTasks, label: "Tasks" },
    { path: "whiteboard", icon: IconWhiteboard, label: "Whiteboard" },
    { path: "video", icon: IconVideo, label: "Video" },
  ];

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="flex h-screen w-full bg-slate-950">
      {/* Sidebar */}
      {/* REVERT 1: Updated width to w-72 to prevent text overlap. */}
      <aside className="w-86 bg-slate-900 border-r border-slate-800 flex flex-col relative overflow-hidden">
        {/* Logo & Back Button */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">TeamStream</h1>
          <button
            onClick={handleBackToDashboard}
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Workspace Info */}
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Current Workspace
            </p>
            {/* 2. ADD THE COPY BUTTON (it will only show when not loading) */}
            {!loading && <CopyButton textToCopy={workspaceId} />}
          </div>
          {loading ? (
            <div className="h-6 bg-slate-800 rounded animate-pulse"></div>
          ) : (
            <p className="text-sm font-semibold text-slate-200 truncate">
              {workspaceName}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              // REVERT 2: Restored original NavLink logic for icon color.
              <NavLink
                key={item.path}
                to={`/workspace/${workspaceSlug}/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={isActive ? "text-cyan-400" : "text-slate-400"}
                    />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area (Header + Content) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="absolute top-6 right-6 z-20">
          <div className="w-full flex justify-end">
            <ProfileDropdown
              userName={userName}
              userEmail={userEmail}
              getInitials={getInitials}
              handleLogout={handleLogout}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WorkspaceLayout;
