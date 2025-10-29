// frontend/src/components/WorkspaceLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import IconChat from "./icons/IconChat";
import IconDocuments from "./icons/IconDocuments";
import IconTasks from "./icons/IconTasks";
import IconWhiteboard from "./icons/IconWhiteboard";
import IconVideo from "./icons/IconVideo";
import ProfileDropdown from "./ProfileDropdown";
import CopyButton from "./CopyButton";
import CallNotificationIndicator from "./CallNotificationIndicator";

function WorkspaceLayout() {
  const navigate = useNavigate();
  const [workspaceId, setWorkspaceId] = useState(null);
  const { workspaceSlug } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getAuthHeader = useCallback(() => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return null;
    }
    return { Authorization: `Bearer ${session.access_token}` };
  }, [navigate]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return;
    }

    const fetchWorkspaceData = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeader();
        if (!headers) return;

        const { data: currentWorkspace } = await axios.get(
          `http://localhost:3001/api/workspaces/${workspaceSlug}`,
          { headers }
        );
        setWorkspaceName(currentWorkspace.name);
        setWorkspaceId(currentWorkspace.id);

        if (session.user) {
          setUserEmail(session.user.email || "user@example.com");
          setUserName(
            session.user?.user_metadata?.display_name ||
              session.user?.email?.split("@")[0] ||
              "User"
          );
        }
      } catch (error) {
        console.error("Failed to fetch workspace data", error);

        if (error.response && error.response.status === 401) {
          localStorage.removeItem("session");
          navigate("/login");
        } else {
          navigate("/dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [workspaceSlug, navigate, getAuthHeader]);

  const handleLogout = () => {
    localStorage.removeItem("session");
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  const navItems = [
    { path: "chat", icon: IconChat, label: "Chat" },
    { path: "documents", icon: IconDocuments, label: "Documents" },
    { path: "tasks", icon: IconTasks, label: "Task Board" },
    { path: "whiteboard", icon: IconWhiteboard, label: "Whiteboard" },
    { path: "video", icon: IconVideo, label: "Video" },
  ];

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-300 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`h-screen bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Top Section */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
              aria-label={
                isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              <svg
                className={`transition-transform duration-300 ${
                  isSidebarCollapsed ? "rotate-180" : ""
                }`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            >
              <h1 className="text-2xl font-bold text-cyan-400 whitespace-nowrap">
                TeamStream
              </h1>
            </div>
          </div>
          <button
            onClick={handleBackToDashboard}
            className={`w-full text-sm font-semibold transition-all duration-200 flex items-center space-x-3 px-4 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-cyan-500 hover:text-slate-900 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <svg
              className="flex-shrink-0"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            >
              <span className="whitespace-nowrap">Back to Dashboard</span>
            </div>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 ml-3 pl-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={`/workspace/${workspaceSlug}/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`flex-shrink-0 ${
                        isActive ? "text-cyan-400" : "text-slate-400"
                      }`}
                    />
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed
                          ? "w-0 opacity-0"
                          : "w-full opacity-100"
                      }`}
                    >
                      <span className="font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="border-t border-slate-800 flex-shrink-0 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ProfileDropdown
                userName={userName}
                userEmail={userEmail}
                getInitials={getInitials}
                handleLogout={handleLogout}
                navigate={navigate}
                workspaceSlug={workspaceSlug}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            >
              <p className="font-semibold text-sm text-slate-200 truncate whitespace-nowrap">
                {userName}
              </p>
              <p className="text-xs text-slate-400 truncate whitespace-nowrap">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        <Outlet />
        
        {/* Call Notification Indicator - Floats over content */}
        <CallNotificationIndicator />
      </main>
    </div>
  );
}

export default WorkspaceLayout;