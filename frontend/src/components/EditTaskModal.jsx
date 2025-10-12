// frontend/src/components/EditTaskModal.jsx
import React, { useState, useEffect } from "react";

export function EditTaskModal({ task, onClose, onSave }) {
  const [content, setContent] = useState(task.content);

  useEffect(() => {
    setContent(task.content);
  }, [task]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(task.id, content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700/50 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Edit Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          rows={6}
          className="w-full p-4 rounded-xl bg-slate-700/80 text-slate-100 placeholder-slate-400 border-2 border-slate-600 focus:border-cyan-500 focus:outline-none transition-colors resize-none shadow-inner"
          placeholder="Enter task description..."
        />

        {/* Help text */}
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
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
          Press{" "}
          <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono text-xs">
            Ctrl + Enter
          </kbd>{" "}
          to save
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-semibold transition-all duration-200 border border-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none"
          >
            Save Changes
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
