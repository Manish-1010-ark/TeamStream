// frontend/src/components/CreateListForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export function CreateListForm({ boardId, workspaceSlug, onListCreated }) {
  const [title, setTitle] = useState('');
  
  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const { data: newList } = await axios.post(
        `http://localhost:3001/api/workspaces/boards/${boardId}/lists`,
        { title, workspaceSlug },
        { headers: getAuthHeader() }
      );
      onListCreated(newList); // Pass the new list up to the parent
      setTitle(''); // Reset the form
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-slate-800 rounded-lg w-80 flex-shrink-0">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter list title..."
        className="w-full p-2 rounded bg-slate-600 text-white border-2 border-transparent focus:border-cyan-500 focus:outline-none"
      />
      <button type="submit" className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-semibold">
        Add List
      </button>
    </form>
  );
}