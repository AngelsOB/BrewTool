import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  return (
    <nav className="top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-lg sm:text-xl font-semibold tracking-tight"
        >
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Beer App
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}

