import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserSite = repo.endsWith(".github.io");
const base = isUserSite ? "/" : repo ? `/${repo}/` : "/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwind(), react()],
  base,
});
