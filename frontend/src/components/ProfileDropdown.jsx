// frontend/src/components/ProfileDropdown.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

function ProfileDropdown({
  userName,
  getInitials,
  handleLogout,
  isSidebarCollapsed,
  navigate,
  workspaceSlug,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Position menu dynamically
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (isOpen && menu) {
      // Reset to default upward position
      menu.classList.remove("top-full", "mt-2");
      menu.classList.add("bottom-full", "mb-2");

      // Measure position
      const menuRect = menu.getBoundingClientRect();

      // Flip if off-screen
      if (menuRect.top < 0) {
        menu.classList.remove("bottom-full", "mb-2");
        menu.classList.add("top-full", "mt-2");
      }
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-cyan-400/50 transition-all"
        aria-label="Profile menu"
      >
        <span className="text-slate-900 font-bold text-sm">
          {getInitials(userName)}
        </span>
      </button>

      {/* Dropdown Menu - FIXED: Added bottom-full by default and proper positioning */}
      <div
        ref={menuRef}
        className={`absolute bottom-full mb-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${isSidebarCollapsed ? "" : ""}`}
      >
        <div className="p-2">
          <button
            onClick={() => {
              navigate(`/workspace/${workspaceSlug}/info`);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
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
            Workspace Info
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 rounded-md transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
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
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDropdown;
