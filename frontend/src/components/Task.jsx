// frontend/src/components/Task.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Add onDelete prop
export function Task({ task, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e) => {
    // This stops the edit modal from opening when we click the delete button
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
      // Use relative positioning for the button
      className="relative bg-slate-700 p-3 m-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing group"
    >
      <p>{task.content}</p>
      {/* Delete button appears on hover */}
      <button
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-red-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
        aria-label="Delete task"
      >
        ✕
      </button>
    </div>
  );
}
