// frontend/src/components/List.jsx
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "./Task";
import { CreateTaskForm } from "./CreateTaskForm";

export function List({
  list,
  workspaceSlug,
  onTaskCreated,
  onTaskClick,
  onDeleteTask,
  // New props we will add in the next step
  onDeleteList,
  onUpdateListTitle,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });
  const taskIds = list.tasks.map((task) => task.id);

  // State for inline title editing
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== list.title) {
      onUpdateListTitle(list.id, title);
    } else {
      setTitle(list.title); // Revert if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") handleTitleBlur();
    if (e.key === "Escape") {
      setTitle(list.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl w-80 flex-shrink-0 border transition-all duration-200 group/list ${
        isOver
          ? "border-cyan-500 shadow-lg shadow-cyan-500/20 bg-slate-800"
          : "border-slate-700/50 shadow-lg"
      }`}
    >
      {/* List Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
        <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>

        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="font-bold text-lg text-slate-100 flex-grow bg-slate-700 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="font-bold text-lg text-slate-100 flex-grow cursor-pointer"
          >
            {list.title}
          </h2>
        )}

        <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-1 rounded-full font-medium">
          {list.tasks.length}
        </span>
        <button
          onClick={() => onDeleteList(list.id)}
          // This className is updated with a conditional
          className={`p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-opacity ${
            isEditing ? "opacity-0" : "opacity-0 group-hover/list:opacity-100"
          }`}
          aria-label="Delete list"
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
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Tasks Container */}
      <div className="space-y-0 mb-3 min-h-[100px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {list.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <svg
                className="w-12 h-12 mb-2 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            list.tasks.map((task) => (
              <Task
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Create Task Form */}
      <CreateTaskForm
        listId={list.id}
        workspaceSlug={workspaceSlug}
        onTaskCreated={onTaskCreated}
      />
    </div>
  );
}
