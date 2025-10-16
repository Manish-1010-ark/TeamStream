import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// DO NOT import the line-clamp plugin here

export default defineConfig({
  // Only Vite plugins go in this array
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,   // Change this to your desired port
    strictPort: true, // Fail if port is already in use
  },
});
