// frontend/src/components/CreateListForm.jsx
import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export function CreateListForm({ boardId, workspaceSlug, onListCreated }) {
  const [title, setTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: newList } = await axios.post(
        `${API_URL}/api/workspaces/boards/${boardId}/lists`,
        { title, workspaceSlug },
        { headers: getAuthHeader() }
      );
      onListCreated(newList);
      setTitle("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to create list", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="bg-slate-800/60 backdrop-blur-sm hover:bg-slate-800 p-4 rounded-xl w-80 flex-shrink-0 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 group"
      >
        <div className="flex items-center justify-center gap-2 text-slate-300 group-hover:text-cyan-400 font-medium">
          <svg
            className="w-5 h-5 group-hover:rotate-90 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add another list</span>
        </div>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl w-80 flex-shrink-0 border border-slate-700/50 shadow-lg"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter list title..."
        autoFocus
        className="w-full p-3 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border-2 border-slate-600 focus:border-cyan-500 focus:outline-none transition-colors mb-2"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none"
        >
          {isSubmitting ? "Adding..." : "Add List"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Cancel"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
