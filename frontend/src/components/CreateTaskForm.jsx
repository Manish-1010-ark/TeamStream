// frontend/src/components/CreateTaskForm.jsx
import React, { useState } from "react";
import axios from "axios";

export function CreateTaskForm({ listId, workspaceSlug, onTaskCreated }) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: newTask } = await axios.post(
        `http://localhost:3001/api/workspaces/lists/${listId}/tasks`,
        { content, workspaceSlug },
        { headers: getAuthHeader() }
      );
      onTaskCreated(newTask);
      setContent("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to create task", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-medium transition-all duration-200 flex items-center gap-2 group border border-slate-600/30 hover:border-slate-500"
      >
        <svg
          className="w-5 h-5 text-cyan-500 group-hover:rotate-90 transition-transform"
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
        <span>Add a card</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter a title for this card..."
        autoFocus
        rows={3}
        className="w-full p-3 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border-2 border-slate-600 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none"
        >
          {isSubmitting ? "Adding..." : "Add Card"}
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
