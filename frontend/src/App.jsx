// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import WorkspaceLayout from "./components/WorkspaceLayout";
import ChatPage from "./pages/workspace/ChatPage";
import DocumentsPage from "./pages/workspace/DocumentsPage";
import TaskBoardPage from "./pages/workspace/TaskBoardPage";
import WhiteboardPage from "./pages/workspace/WhiteboardPage";
import VideoPage from "./pages/workspace/VideoPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        {/* Redirect dashboard to default workspace */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Workspace Routes with Nested Children */}
        <Route path="/workspace/:workspaceSlug" element={<WorkspaceLayout />}>
          <Route path="chat" element={<ChatPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="tasks" element={<TaskBoardPage />} />
          <Route path="whiteboard" element={<WhiteboardPage />} />
          <Route path="video" element={<VideoPage />} />
          {/* Default redirect to chat when just accessing workspace */}
          <Route index element={<Navigate to="chat" replace />} />
        </Route>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
