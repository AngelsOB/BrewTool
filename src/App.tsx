import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";
import Toaster from "./components/Toaster";
import { useThemeStore } from "./stores/useThemeStore";

export default function App() {
  // Initialize theme on mount
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Re-apply theme on mount to ensure consistency
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--text))] transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[rgb(var(--accent))] focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--coral-600)]"
      >
        Skip to main content
      </a>
      <NavBar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

