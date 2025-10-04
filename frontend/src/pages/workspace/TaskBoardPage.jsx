// frontend/src/pages/workspace/TaskBoardPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import io from "socket.io-client"; // This import was missing

import { CreateListForm } from "../../components/CreateListForm";
import { EditTaskModal } from "../../components/EditTaskModal"; // Import the modal

import { List } from "../../components/List";

function TaskBoardPage() {
  const { workspaceSlug } = useParams();
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // New state for the modal

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const fetchBoardData = async () => {
    // No setLoading(true) here to allow for silent background refetches
    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/workspaces/${workspaceSlug}/board`,
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
  }, [workspaceSlug]);

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Keep a copy of the old state for error recovery
    const oldBoard = boardData;
    let newBoard = boardData;

    // This function updates the state visually *before* the API call (optimistic update)
    setBoardData((board) => {
      const activeList = board.lists.find((l) =>
        l.tasks.some((t) => t.id === active.id)
      );
      const overList = board.lists.find(
        (l) => l.id === over.id || l.tasks.some((t) => t.id === over.id)
      );
      if (!activeList || !overList) return board;

      if (activeList.id === overList.id) {
        // Reordering in the same list
        const oldIndex = activeList.tasks.findIndex((t) => t.id === active.id);
        const newIndex = overList.tasks.findIndex((t) => t.id === over.id);
        const updatedTasks = arrayMove(activeList.tasks, oldIndex, newIndex);
        const updatedLists = board.lists.map((list) =>
          list.id === activeList.id ? { ...list, tasks: updatedTasks } : list
        );
        newBoard = { ...board, lists: updatedLists };
        return newBoard;
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
        const updatedLists = board.lists.map((list) => {
          if (list.id === activeList.id)
            return { ...list, tasks: sourceListTasks };
          if (list.id === overList.id) return { ...list, tasks: destListTasks };
          return list;
        });
        newBoard = { ...board, lists: updatedLists };
        return newBoard;
      }
    });

    // Prepare a clean payload for the API
    const listsPayload = newBoard.lists.map((list) => ({
      id: list.id,
      tasks: list.tasks.map((task) => task.id),
    }));

    // After the optimistic update, call the API to save the changes
    axios
      .patch(
        "http://localhost:3001/api/workspaces/board/positions", // This is the correct URL
        { lists: listsPayload, workspaceSlug },
        { headers: getAuthHeader() }
      )
      .catch((err) => {
        console.error("Failed to save board state:", err);
        // If the API call fails, revert the state to the previous version
        setBoardData(oldBoard);
      });
  };

  // This function will add the new task to our local state
  const handleTaskCreated = (newTask) => {
    setBoardData((prevBoard) => {
      const updatedLists = prevBoard.lists.map((list) => {
        if (list.id === newTask.list_id) {
          return { ...list, tasks: [...list.tasks, newTask] };
        }
        return list;
      });
      return { ...prevBoard, lists: updatedLists };
    });
  };

  if (loading) {
    return <div className="p-4 text-white">Loading Board...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="p-6 text-white overflow-x-auto h-full">
          <header>
            <h1 className="text-2xl font-bold">Task Board</h1>
            <p className="text-sm text-slate-400 mb-6">
              Real-time taskboard — where teams push work forward.
            </p>
          </header>
          <div className="flex items-start gap-6">
            {boardData?.lists.map((list) => (
              <List
                key={list.id}
                list={list}
                workspaceSlug={workspaceSlug}
                onTaskCreated={handleTaskCreated}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDeleteTask} // Pass the new handler
              />
            ))}
            {/* Add the new form here */}
            <CreateListForm
              boardId={boardData?.id}
              workspaceSlug={workspaceSlug}
              onListCreated={handleListCreated}
            />
          </div>
        </div>
      </DndContext>
      {/* Conditionally render the modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
}

export default TaskBoardPage;
