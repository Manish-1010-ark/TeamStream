// frontend/src/pages/workspace/TaskBoardPage.jsx
import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import io from "socket.io-client"; // This import was missing

import { CreateListForm } from "../../components/CreateListForm";
import { EditTaskModal } from "../../components/EditTaskModal"; // Import the modal

import { List } from "../../components/List";
import { Task } from "../../components/Task";

function TaskBoardPage() {
  const { workspaceSlug, boardId } = useParams();
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null); // For DragOverlay

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const fetchBoardData = async () => {
    // No setLoading(true) here to allow for silent background refetches
    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/workspaces/boards/${boardId}`, // Use boardId here
        { headers: getAuthHeader() }
      );
      setBoardData(data);
    } catch (err) {
      setError("Failed to load the board.");
      console.error(err);
    } finally {
      // Only set initial loading to false
      if (loading) setLoading(false);
    }
  };

  // This function adds the new list to our local state
  const handleListCreated = (newList) => {
    setBoardData((prevBoard) => ({
      ...prevBoard,
      lists: [...prevBoard.lists, newList],
    }));
  };

  const handleDeleteTask = (taskId) => {
    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const oldBoard = boardData;
    // Optimistically remove the task from the UI
    setBoardData((prev) => {
      const newLists = prev.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      }));
      return { ...prev, lists: newLists };
    });

    // Call the API to delete the task from the database
    axios
      .delete(
        `http://localhost:3001/api/workspaces/tasks/${taskId}`,
        // DELETE requests need to pass body data in a `data` property
        {
          headers: getAuthHeader(),
          data: { workspaceSlug },
        }
      )
      .catch((err) => {
        console.error("Failed to delete task", err);
        // Revert UI on error
        setBoardData(oldBoard);
      });
  };

  useEffect(() => {
    fetchBoardData(); // Initial fetch

    const socket = io("http://localhost:3001");
    socket.emit("join_workspace", workspaceSlug);
    socket.on("board_updated", () => {
      fetchBoardData(); // Re-fetch on updates from other users
    });

    return () => {
      socket.disconnect();
    };
  }, [workspaceSlug, boardId]);

  const handleTaskClick = (task) => {
    setEditingTask(task);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleSaveTask = async (taskId, newContent) => {
    try {
      // Optimistically update the UI
      setBoardData((prev) => {
        const newLists = prev.lists.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) =>
            task.id === taskId ? { ...task, content: newContent } : task
          ),
        }));
        return { ...prev, lists: newLists };
      });

      // Close the modal
      handleCloseModal();

      // Call the API to save the change
      await axios.patch(
        `http://localhost:3001/api/workspaces/tasks/${taskId}`,
        { content: newContent, workspaceSlug },
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error("Failed to save task", error);
      // Optional: Add logic to revert the change on error
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // 4. Create an onDragStart handler to set the active task
  const onDragStart = (event) => {
    const { active } = event;
    const task = boardData.lists
      .flatMap((list) => list.tasks)
      .find((task) => task.id === active.id);
    setActiveTask(task);
  };

  const onDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldBoard = boardData; // Keep a copy for error recovery

    // 1. First, calculate the new board state synchronously
    let newBoard = boardData;
    const activeList = boardData.lists.find((l) =>
      l.tasks.some((t) => t.id === active.id)
    );
    const overList = boardData.lists.find(
      (l) => l.id === over.id || l.tasks.some((t) => t.id === over.id)
    );

    if (activeList && overList) {
      if (activeList.id === overList.id) {
        // Reordering in the same list
        const oldIndex = activeList.tasks.findIndex((t) => t.id === active.id);
        const newIndex = overList.tasks.findIndex((t) => t.id === over.id);
        const updatedTasks = arrayMove(activeList.tasks, oldIndex, newIndex);
        const updatedLists = boardData.lists.map((list) =>
          list.id === activeList.id ? { ...list, tasks: updatedTasks } : list
        );
        newBoard = { ...boardData, lists: updatedLists };
      } else {
        // Moving to a different list
        let draggedTask;
        const sourceListTasks = activeList.tasks.filter((task) => {
          if (task.id === active.id) {
            draggedTask = task;
            return false;
          }
          return true;
        });
        let newIndex = overList.tasks.findIndex((t) => t.id === over.id);
        if (newIndex === -1) newIndex = overList.tasks.length;
        const destListTasks = [...overList.tasks];
        destListTasks.splice(newIndex, 0, draggedTask);
        const updatedLists = boardData.lists.map((list) => {
          if (list.id === activeList.id)
            return { ...list, tasks: sourceListTasks };
          if (list.id === overList.id) return { ...list, tasks: destListTasks };
          return list;
        });
        newBoard = { ...boardData, lists: updatedLists };
      }
    }

    // 2. Set the state for the optimistic UI update
    setBoardData(newBoard);

    // 3. Prepare the payload from the correctly calculated new state
    const listsPayload = newBoard.lists.map((list) => ({
      id: list.id,
      tasks: list.tasks.map((task) => task.id),
    }));

    // 4. Call the API with the correct data
    axios
      .patch(
        `http://localhost:3001/api/workspaces/board/positions`,
        { lists: listsPayload, workspaceSlug },
        { headers: getAuthHeader() }
      )
      .catch((err) => {
        console.error("Failed to save board state:", err);
        setBoardData(oldBoard); // Revert on error
      });
  };

  // Also add this function for deleting lists
  const handleDeleteList = (listId) => {
    if (
      !window.confirm(
        "Are you sure? This will also delete all tasks in this list."
      )
    )
      return;

    const oldBoard = boardData;
    // Optimistic UI update
    setBoardData((prev) => ({
      ...prev,
      lists: prev.lists.filter((list) => list.id !== listId),
    }));

    // API Call
    axios
      .delete(`http://localhost:3001/api/workspaces/lists/${listId}`, {
        headers: getAuthHeader(),
        data: { workspaceSlug },
      })
      .catch((err) => {
        console.error("Failed to delete list:", err);
        setBoardData(oldBoard); // Revert on error
      });
  };

  // Add this function back into TaskBoardPage.jsx
  const handleTaskCreated = (newTask) => {
    setBoardData((prevBoard) => {
      const updatedLists = prevBoard.lists.map((list) => {
        if (list.id === newTask.list_id) {
          // Add the new task to the end of the correct list
          return { ...list, tasks: [...list.tasks, newTask] };
        }
        return list;
      });
      return { ...prevBoard, lists: updatedLists };
    });
  };

  // Also add this function for updating list titles
  const handleUpdateListTitle = (listId, newTitle) => {
    const oldBoard = boardData;
    // Optimistic UI update
    setBoardData((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === listId ? { ...list, title: newTitle } : list
      ),
    }));

    // API Call
    axios
      .patch(
        `http://localhost:3001/api/workspaces/lists/${listId}`,
        { title: newTitle, workspaceSlug },
        { headers: getAuthHeader() }
      )
      .catch((err) => {
        console.error("Failed to update list title:", err);
        setBoardData(oldBoard); // Revert on error
      });
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">Loading Board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-red-400">Error</h3>
          </div>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 6. Update DndContext with the new handlers */}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="h-full p-6 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Header - will not grow */}
          <header className="mb-8 animate-fade-in flex-shrink-0">
            <Link
              to={`/workspace/${workspaceSlug}/tasks`}
              className="w-28 h-10 rounded-lg bg-slate-800 text-slate-300 font-semibold relative group flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-105 overflow-hidden"
            >
              {/* Expanding cyan background */}
              <div className="bg-cyan-500 rounded-md h-8 w-8 flex items-center justify-center absolute left-1 top-1 group-hover:w-[calc(100%-8px)] z-6 transition-all duration-500">
                {/* Left arrow icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 1024"
                  height="20px"
                  width="20px"
                  className="text-slate-900"
                  fill="currentColor"
                >
                  <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" />
                  <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" />
                </svg>
              </div>

              {/* Text label — hides on hover */}
              <p className="z-20 pl-8  group-hover:opacity-0 duration-300 group-hover:-translate-x-8 ">
                Go Back
              </p>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent pb-1">
                {boardData?.title}
              </h1>
            </div>
            <p className="text-slate-400 text-base ml-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Real-time taskboard — where teams push work forward
            </p>
          </header>

          {/* FIX: Board Container - will now grow to fill remaining space */}
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex items-start gap-5 min-w-max h-full">
              {boardData?.lists.map((list, index) => (
                <div
                  key={list.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <List
                    list={list}
                    workspaceSlug={workspaceSlug}
                    onTaskCreated={handleTaskCreated}
                    onTaskClick={handleTaskClick}
                    onDeleteTask={handleDeleteTask}
                    // Add these two new props
                    onUpdateListTitle={handleUpdateListTitle}
                    onDeleteList={handleDeleteList}
                  />
                </div>
              ))}
              <div
                className="animate-slide-in"
                style={{
                  animationDelay: `${(boardData?.lists.length || 0) * 0.1}s`,
                }}
              >
                <CreateListForm
                  boardId={boardData?.id}
                  workspaceSlug={workspaceSlug}
                  onListCreated={handleListCreated}
                />
              </div>
            </div>
          </div>
        </div>
        {/* 7. Add the DragOverlay component */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <Task task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          border-radius: 10px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #0891b2, #2563eb);
        }
      `}</style>
    </>
  );
}

export default TaskBoardPage;
