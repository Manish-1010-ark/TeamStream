// frontend/src/liveblocks.js
import { createClient } from "@liveblocks/client";

const client = createClient({
  authEndpoint: async (room) => {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session || !session.access_token) {
      // This will prevent the auth call from being made if the user is logged out.
      // The page might still fail, but it won't be a Liveblocks auth error.
      throw new Error("Not authenticated");
    }

    const API_URL = import.meta.env.VITE_API_URL;
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
      throw new Error(`Authentication failed: ${response.status} ${errorBody}`);
    }

    return await response.json();
  },
});

console.log("From liveblocks.js - Exporting client:", client);
export default client;
