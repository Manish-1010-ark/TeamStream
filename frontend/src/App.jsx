// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { LiveblocksProvider } from "@liveblocks/react";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import WorkspaceLayout from "./components/WorkspaceLayout";
import ChatPage from "./pages/workspace/ChatPage";
import DocumentsPage from "./pages/workspace/DocumentsPage";
import DocumentDetailPage from "./pages/workspace/DocumentDetailPage";
import TaskBoardPage from "./pages/workspace/TaskBoardPage";
import BoardsListPage from "./pages/workspace/BoardsListPage";
import WhiteboardPage from "./pages/workspace/WhiteboardPage";
import VideoPage from "./pages/workspace/VideoPage";
import WorkspaceInfoPage from "./pages/workspace/WorkspaceInfoPage";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  return (
    <Router>
      <LiveblocksProvider
        authEndpoint={async (room) => {
          const session = JSON.parse(localStorage.getItem("session"));
          if (!session || !session.access_token) {
            throw new Error("Not authenticated");
          }

          const response = await fetch(`${API_URL}/api/liveblocks/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ room }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
              `Authentication failed: ${response.status} ${errorBody}`
            );
          }

          return await response.json();
        }}
      >
        <Routes>
          {/* Authentication Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Workspace Routes */}
          <Route path="/workspace/:workspaceSlug" element={<WorkspaceLayout />}>
            <Route path="chat" element={<ChatPage />} />
            <Route path="documents">
              <Route index element={<DocumentsPage />} />
              <Route path=":documentId" element={<DocumentDetailPage />} />
            </Route>
            <Route path="tasks">
              <Route index element={<BoardsListPage />} />
              <Route path=":boardId" element={<TaskBoardPage />} />
            </Route>
            <Route path="whiteboard" element={<WhiteboardPage />} />
            <Route path="video" element={<VideoPage />} />
            <Route path="info" element={<WorkspaceInfoPage />} />
            <Route index element={<Navigate to="chat" replace />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </LiveblocksProvider>
    </Router>
  );
}

export default App;
