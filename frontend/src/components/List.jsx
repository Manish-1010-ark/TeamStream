// frontend/src/components/List.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "./Task";
import { CreateTaskForm } from "./CreateTaskForm"; // Import the new form

export function List({
  list,
  workspaceSlug,
  onTaskCreated,
  onTaskClick,
  onDeleteTask,
}) {
  // Accept new props
  const { setNodeRef } = useDroppable({ id: list.id });
  const taskIds = list.tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef}
      className="bg-slate-800 p-3 rounded-lg w-80 flex-shrink-0"
    >
      <h2 className="font-bold text-lg p-2 mb-2">{list.title}</h2>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {list.tasks.map((task) => (
          <Task
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onDelete={onDeleteTask} // Pass it here
          /> // Pass it here
        ))}
      </SortableContext>
      {/* Add the form to the bottom of the list */}
      <CreateTaskForm
        listId={list.id}
        workspaceSlug={workspaceSlug}
        onTaskCreated={onTaskCreated}
      />
    </div>
  );
}
