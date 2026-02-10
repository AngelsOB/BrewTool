import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="card-glass card-inner-ring neon-glow p-6 sm:p-10">
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Brew better beer.
            </h1>
            <p className="mt-3 max-w-prose text-muted text-sm sm:text-base">
              Fast calculators, a clean recipe builder, and opinionated defaults
              so you can focus on the craft.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link to="/recipes" className="btn-neon">
                Start a Recipe
              </Link>
              <Link
                to="/beta-builder"
                className="rounded-xl border border-blue-500/40 bg-blue-500/15 px-5 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-200 shadow-soft hover:bg-blue-500/25 hover:border-blue-500/60 transition-colors"
              >
                🚀 Beta Builder (New!)
              </Link>
              <Link
                to="/calculators"
                className="btn-outline"
              >
                Open Calculators
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-white/10 dark:bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium text-strong">ABV</div>
              <div className="text-muted">OG/FG quick math</div>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-white/10 dark:bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium text-strong">Strike Temp</div>
              <div className="text-muted">Mash-in target</div>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-white/10 dark:bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium text-strong">IBU</div>
              <div className="text-muted">Tinseth est.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/calculators"
          className="card-glass card-inner-ring p-5 neon-glow"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-strong mb-1">Calculators</div>
              <div className="text-sm text-muted">
                ABV, IBU, water chemistry, and more
              </div>
            </div>
            <span className="text-muted opacity-50">→</span>
          </div>
        </Link>
        <Link
          to="/recipes"
          className="card-glass card-inner-ring p-5 neon-glow"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-strong mb-1">Recipe Builder</div>
              <div className="text-sm text-muted">
                Create and manage your brewing recipes
              </div>
            </div>
            <span className="text-muted opacity-50">→</span>
          </div>
        </Link>
        <Link
          to="/beta-builder"
          className="card-glass card-inner-ring p-5 neon-glow"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-strong mb-1">Beta Builder</div>
              <div className="text-sm text-muted">
                Advanced recipe builder with brew sessions
              </div>
            </div>
            <span className="text-muted opacity-50">→</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
