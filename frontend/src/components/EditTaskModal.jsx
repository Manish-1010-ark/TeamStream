// frontend/src/components/EditTaskModal.jsx
import React, { useState, useEffect } from 'react';

export function EditTaskModal({ task, onClose, onSave }) {
  const [content, setContent] = useState(task.content);

  // Update state if the selected task changes
  useEffect(() => {
    setContent(task.content);
  }, [task]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(task.id, content);
    }
  };

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-xl font-bold mb-4 text-white">Edit Task</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-40 p-2 rounded bg-slate-700 text-white border-2 border-slate-600 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex justify-end gap-4 mt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white font-semibold"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}