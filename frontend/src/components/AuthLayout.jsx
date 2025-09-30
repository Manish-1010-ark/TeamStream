// frontend/src/components/AuthLayout.jsx
import React from "react";

function AuthLayout({ title, children }) {
  return (
    <div
      // Added `w-screen` to ensure full-width
      className="min-h-screen w-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{
        // Corrected the background image path
        backgroundImage: `url('/bg.png')`,
        backgroundColor: "#0a1628", // Fallback color
      }}
    >
      <div className="absolute inset-0 bg-slate-900/50"></div>

      <div className="relative bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-cyan-500/30 w-full max-w-md hover:border-cyan-500/50 transition-all duration-300">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-2xl blur opacity-30"></div>

        <div className="relative">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent animate-pulse"
              style={{ animationDuration: "3s" }}
            >
              TeamStream
            </h1>
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
