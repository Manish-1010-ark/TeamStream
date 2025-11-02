// frontend/src/pages/workspace/DocumentDetailPage.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import CollaborativeEditorWrapper from "../../components/documenteditor/CollaborativeEditor";

function DocumentDetailPage() {
  const { workspaceSlug, documentId } = useParams();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative p-4 border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30 flex-shrink-0 z-10">
        <Link
          to={`/workspace/${workspaceSlug}/documents`}
          className="w-28 h-10 rounded-lg bg-slate-800 text-slate-300 font-semibold relative group flex items-center justify-center transition-transform duration-200 hover:scale-105 overflow-hidden"
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

          {/* Text label - hides on hover */}
          <p className="z-20 pl-8 group-hover:opacity-0 duration-300 group-hover:-translate-x-8">
            Go Back
          </p>
        </Link>
      </header>

      {/* Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-100 text-slate-900 overflow-auto">
          <CollaborativeEditorWrapper documentId={documentId} />
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailPage;
