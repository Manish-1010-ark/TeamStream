// backend/index.js

import express from "express";
import cors from "cors";

import authRoutes from "./authRoutes.js";
import workspaceRoutes from "./workspaceRoutes.js";

import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT; // Or any port you prefer

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON requests

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
