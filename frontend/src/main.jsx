// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Add these two lines for Liveblocks UI styling
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
