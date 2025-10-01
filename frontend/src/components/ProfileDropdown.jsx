// frontend/src/components/ProfileDropdown.jsx
import React, { useState, useEffect, useRef } from "react";

function ProfileDropdown({ userName, userEmail, getInitials, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // This effect handles closing the dropdown if you click outside of it
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-cyan-400/50 transition-all"
      >
        <span className="text-slate-900 font-bold text-sm">
          {getInitials(userName)}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-20">
          <div className="p-4 border-b border-slate-700">
            <p className="font-semibold text-slate-200 truncate">{userName}</p>
            <p className="text-sm text-slate-400 truncate">{userEmail}</p>
          </div>
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;