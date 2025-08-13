import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <div className="mt-4 p-4 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
          Tailwind OK — colors, padding, border, rounded
        </div>
        <Link
          to="/recipes"
          className="px-3 py-2 rounded bg-emerald-600 text-white text-sm"
        >
          Add Recipe
        </Link>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/calculators"
          className="rounded border bg-white p-4 shadow-sm hover:shadow"
        >
          <div className="font-medium mb-1">Calculators</div>
          <div className="text-sm text-neutral-600">
            ABV, IBU, SRM, Strike Temp, Priming
          </div>
        </Link>
      </section>
    </div>
  );
}
