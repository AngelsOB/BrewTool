import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Beer App</span>
        </Link>
        <div className="flex gap-1 sm:gap-2 text-sm">
          <Link to="/" className="rounded-md px-3 py-2 hover:bg-neutral-100">
            Home
          </Link>
          <Link to="/calculators" className="rounded-md px-3 py-2 hover:bg-neutral-100">
            Calculators
          </Link>
          <Link to="/recipes" className="rounded-md px-3 py-2 hover:bg-neutral-100">
            Recipes
          </Link>
        </div>
      </div>
    </nav>
  );
}
