import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function BoardsListPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeader = () => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      navigate("/login");
      return null;
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchBoards = async () => {
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      const { data } = await axios.get(
        `http://localhost:3001/api/workspaces/${workspaceSlug}/boards`,
        { headers }
      );
      setBoards(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch boards:", error);
      setError("Failed to load boards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [workspaceSlug]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(
        `http://localhost:3001/api/workspaces/${workspaceSlug}/boards`,
        { title: newBoardTitle },
        { headers: getAuthHeader() }
      );
      setNewBoardTitle("");
      fetchBoards();
    } catch (error) {
      console.error("Failed to create board:", error);
      setError("Failed to create board. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Handler function for deleting a board
  const handleDeleteBoard = async (e, boardId) => {
    // Stop the <Link> from navigating when the delete button is clicked
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this board and all its content?"
      )
    ) {
      return;
    }

    // Optimistic UI update: remove the board from the list immediately
    const originalBoards = [...boards];
    setBoards(boards.filter((board) => board.id !== boardId));

    try {
      await axios.delete(
        `http://localhost:3001/api/workspaces/boards/${boardId}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error("Failed to delete board:", error);
      setError("Failed to delete the board. Please try again.");
      setBoards(originalBoards); // Revert the UI on error
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">
            Loading Boards...
          </p>
        </div>
      </div>
    );
  }

  if (error && boards.length === 0) {
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
            onClick={fetchBoards}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              Task Boards
            </h1>
          </div>
          <p className="text-slate-400 text-base ml-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Organize your projects and workflows
          </p>
        </header>

        {/* Error Banner */}
        {error && boards.length > 0 && (
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

        {/* Boards Grid */}
        {boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {boards.map((board, index) => (
              <Link
                to={`/workspace/${workspaceSlug}/tasks/${board.id}`}
                key={board.id}
                className="group relative block p-6 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 animate-slide-in overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* NEW: Delete button */}
                <button
                  onClick={(e) => handleDeleteBoard(e, board.id)}
                  className="absolute top-6 right-3 p-1.5 bg-slate-700/50 hover:bg-red-500/80 rounded-full text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10 "
                  aria-label="Delete board"
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
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                {/* Card decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all ">
                      <svg
                        className="w-6 h-6 text-white "
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="font-semibold text-lg text-slate-100 truncate mb-1 group-hover:text-cyan-300 transition-colors">
                    {board.title}
                  </h2>
                  <p className="text-sm text-slate-500">Click to open board</p>
                </div>
              </Link>
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
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No boards yet
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Create your first task board to get started organizing your
              projects and workflows
            </p>
          </div>
        )}

        {/* Create Board Form */}
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
              Create New Board
            </h2>
          </div>
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <div>
              <label
                htmlFor="boardTitle"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Board Title
              </label>
              <input
                id="boardTitle"
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board title..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={!newBoardTitle.trim() || isSubmitting}
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
                  <span>Create Board</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

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

export default BoardsListPage;
