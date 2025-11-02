// frontend/src/components/CollaborativeEditor.jsx
import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import FontSize from "tiptap-extension-font-size";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

const Editor = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        history: false,
      }),
      Underline,
      TextStyle,
      FontSize,
    ],
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none p-8 focus:outline-none min-h-screen ${
          isDarkMode ? "prose-invert" : ""
        }`,
        style: `font-size: ${fontSize}px`,
      },
    },
  });

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 ${
        active
          ? isDarkMode
            ? "bg-cyan-500 text-white"
            : "bg-cyan-500 text-white"
          : isDarkMode
          ? "hover:bg-slate-700 text-slate-300"
          : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </button>
  );

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 32);
    setFontSize(newSize);
    if (editor) {
      editor.chain().focus().setFontSize(`${newSize}px`).run();
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    if (editor) {
      editor.chain().focus().setFontSize(`${newSize}px`).run();
    }
  };

  return (
    <div
      className={`relative h-full w-full transition-colors duration-300 ${
        isDarkMode ? "bg-slate-900" : "bg-white"
      }`}
    >
      {/* Toolbar */}
      <div
        className={`sticky top-0 z-20 border-b ${
          isDarkMode
            ? "bg-slate-800/95 border-slate-700"
            : "bg-white/95 border-slate-200"
        } backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 mr-2">
              <ToolbarButton
                onClick={decreaseFontSize}
                title="Decrease font size"
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
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </ToolbarButton>
              <span
                className={`px-3 py-1 rounded-lg font-medium text-sm min-w-[3rem] text-center ${
                  isDarkMode
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {fontSize}
              </span>
              <ToolbarButton
                onClick={increaseFontSize}
                title="Increase font size"
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
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </ToolbarButton>
            </div>

            <div
              className={`w-px h-6 ${
                isDarkMode ? "bg-slate-700" : "bg-slate-300"
              }`}
            ></div>

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 4h8M8 20h8M15 4L9 20"
                />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 19h12M8 5v6a4 4 0 008 0V5"
                />
              </svg>
            </ToolbarButton>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isDarkMode ? "bg-slate-700/50" : "bg-slate-100"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span
                className={`text-xs font-medium ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Connected
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-slate-700 text-yellow-400 hover:bg-slate-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div
        className={`h-[calc(100%-4rem)] overflow-auto ${
          isDarkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default function CollaborativeEditorWrapper({ documentId }) {
  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-slate-600">Loading document...</div>
      </div>
    );
  }

  return (
    <RoomProvider id={`document:${documentId}`} initialPresence={{}}>
      <ClientSideSuspense
        fallback={
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 text-lg">Loading editor...</p>
            </div>
          </div>
        }
      >
        <Editor />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
