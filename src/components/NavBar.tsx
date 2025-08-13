import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">
          Beer App
        </Link>
        <div className="flex gap-4 text-sm">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/calculators" className="hover:underline">
            Calculators
          </Link>
          <Link to="/recipes" className="hover:underline">
            Recipes
          </Link>
        </div>
      </div>
    </nav>
  );
}
