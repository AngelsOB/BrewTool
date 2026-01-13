import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useThemeStore } from "./stores/useThemeStore";

export default function App() {
  // Initialize theme on mount
  const { theme, setTheme } = useThemeStore();
  
  useEffect(() => {
    // Re-apply theme on mount to ensure consistency
    setTheme(theme);
  }, []);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))] transition-colors">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

