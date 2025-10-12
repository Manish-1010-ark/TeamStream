// backend/liveblocksAuth.js
import { Liveblocks } from "@liveblocks/node";
import { requireAuth } from "./authMiddleware.js";
import express from "express";

const router = express.Router();

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

router.post("/auth", requireAuth, async (req, res) => {
  try {
    const { room } = req.body;

    if (!room) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    const user = req.user; // From our requireAuth middleware

    // Identify the user and provide their metadata
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.user_metadata?.display_name || user.username || user.email,
        email: user.email,
      },
    });

    // Give the user access to the specified room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return a token
    const { status, body } = await session.authorize();

    // Important: Return JSON, not just end(body)
    return res.status(status).json(JSON.parse(body));
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res
      .status(500)
      .json({ error: "Failed to authorize Liveblocks session" });
  }
});

export default router;
