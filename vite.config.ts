import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwind(), react()],
  base: "/",
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // heavy libs into separate async chunks
          recharts: ["recharts"],
          dndkit: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          reactvendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
