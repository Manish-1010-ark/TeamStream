// frontend/src/components/CreateTaskForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export function CreateTaskForm({ listId, workspaceSlug, onTaskCreated }) {
  const [content, setContent] = useState('');
  
  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const { data: newTask } = await axios.post(
        `http://localhost:3001/api/workspaces/lists/${listId}/tasks`,
        { content, workspaceSlug },
        { headers: getAuthHeader() }
      );
      onTaskCreated(newTask); // Pass the new task up to the parent
      setContent(''); // Reset the form
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter a title for this card..."
        className="w-full p-2 rounded bg-slate-600 text-white border-2 border-transparent focus:border-cyan-500 focus:outline-none"
      />
      <button type="submit" className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-semibold">
        Add Card
      </button>
    </form>
  );
}