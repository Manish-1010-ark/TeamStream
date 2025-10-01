// frontend/src/components/icons/IconTasks.jsx
import React from 'react';

function IconTasks({ className = "text-slate-400" }) {
  return (
    <svg 
      className={className} 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="2" width="18" height="20" rx="2" ry="2" />
      <line x1="9" y1="8" x2="9" y2="8.01" />
      <line x1="9" y1="12" x2="9" y2="12.01" />
      <line x1="9" y1="16" x2="9" y2="16.01" />
      <line x1="13" y1="8" x2="19" y2="8" />
      <line x1="13" y1="12" x2="19" y2="12" />
      <line x1="13" y1="16" x2="19" y2="16" />
    </svg>
  );
}

export default IconTasks;