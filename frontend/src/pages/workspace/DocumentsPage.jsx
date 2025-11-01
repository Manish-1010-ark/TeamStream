// frontend/src/pages/workspace/DocumentsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================================
// DOCUMENT CARD MENU COMPONENT
// ============================================================================
function DocumentCardMenu({ document: doc, onDelete, onRename }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () =>
      window.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = () => {
    const newTitle = prompt("Enter new document title:", doc.title);
    if (newTitle && newTitle.trim() !== doc.title) {
      onRename(doc.id, newTitle.trim());
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(doc.id);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="absolute top-4 right-4 z-10">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRename();
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN DOCUMENTS PAGE COMPONENT
// ============================================================================
function DocumentsPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return null;
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchDocuments = async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/api/workspaces/${workspaceSlug}/documents`,
        { headers }
      );
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError("Failed to load documents.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: newDoc } = await axios.post(
        `${API_URL}/api/workspaces/${workspaceSlug}/documents`,
        { title: newDocTitle },
        { headers: getAuthHeader() }
      );
      setNewDocTitle("");
      navigate(`/workspace/${workspaceSlug}/documents/${newDoc.id}`);
    } catch (error) {
      console.error("Failed to create document:", error);
      setError("Failed to create document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    const originalDocuments = [...documents];
    setDocuments(documents.filter((doc) => doc.id !== docId)); // Optimistic update

    try {
      await axios.delete(`${API_URL}/api/workspaces/documents/${docId}`, {
        headers: getAuthHeader(),
      });
    } catch (err) {
      console.error("Failed to delete document", err);
      setError("Failed to delete document.");
      setDocuments(originalDocuments); // Revert on error
    }
  };

  const handleRenameDocument = async (docId, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;

    const originalDocuments = [...documents];
    // Optimistic update
    setDocuments((docs) =>
      docs.map((doc) => (doc.id === docId ? { ...doc, title: newTitle } : doc))
    );

    try {
      await axios.patch(
        `${API_URL}/api/workspaces/documents/${docId}`,
        { title: newTitle },
        { headers: getAuthHeader() }
      );
    } catch (err) {
      console.error("Failed to rename document", err);
      setError("Failed to rename document.");
      setDocuments(originalDocuments); // Revert on error
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    fetchDocuments();
  }, [workspaceSlug]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">
            Loading Documents...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error && documents.length === 0) {
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
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-auto custom-scrollbar">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Documents
            </h1>
          </div>
          <p className="text-slate-400 text-base ml-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Collaborative document editing for your team
          </p>
        </header>

        {/* Error Banner */}
        {error && documents.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
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
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Documents Grid */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className="group relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 animate-slide-in overflow-visible"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Document Card Menu */}
                <DocumentCardMenu
                  document={doc}
                  onDelete={handleDeleteDocument}
                  onRename={handleRenameDocument}
                />

                {/* Document Link */}
                <Link
                  to={`/workspace/${workspaceSlug}/documents/${doc.id}`}
                  className="block p-6"
                >
                  {/* Card decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h2 className="font-semibold text-lg text-slate-100 truncate mb-2 group-hover:text-cyan-300 transition-colors">
                      {doc.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Last modified:{" "}
                      {new Date(doc.last_modified).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No documents yet
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Create your first document to start collaborating with your team
            </p>
          </div>
        )}

        {/* Create Document Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-xl shadow-xl animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-100">
              Create New Document
            </h2>
          </div>
          <form onSubmit={handleCreateDocument} className="space-y-4">
            <div>
              <label
                htmlFor="docTitle"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Document Title
              </label>
              <input
                id="docTitle"
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={!newDocTitle.trim() || isSubmitting}
              className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create & Open</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Styles */}
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
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
      `}</style>
    </div>
  );
}

export default DocumentsPage;
