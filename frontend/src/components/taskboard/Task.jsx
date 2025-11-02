// frontend/src/components/Task.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function Task({ task, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="relative bg-gradient-to-br from-slate-700 to-slate-800 p-4 mb-3 rounded-xl shadow-lg hover:shadow-xl hover:from-slate-600 hover:to-slate-700 cursor-grab active:cursor-grabbing group transition-all duration-200 border border-slate-600/50"
    >
      <p className="text-slate-100 pr-8 leading-relaxed line-clamp-3">
        {task.content}
      </p>

      {/* Delete button — clean orange style with visible trash icon */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center
             bg-orange-500 text-white hover:bg-orange-600 hover:scale-110
             opacity-0 group-hover:opacity-100 transition-all duration-200
             focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-orange-400 shadow-md"
        aria-label="Delete task"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white" // <— ensures the icon is visibly white
          stroke="white" // <— explicitly set stroke color
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          {/* Trash can body */}
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6z" />
          {/* Inner delete lines */}
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {/* Drag indicator */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-30 transition-opacity">
        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
      </div>
    </div>
  );
}
