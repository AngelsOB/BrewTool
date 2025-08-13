import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <section className="card-glass card-inner-ring neon-glow p-6 sm:p-10">
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Brew better beer.
            </h1>
            <p className="mt-3 max-w-prose text-white/70 text-sm sm:text-base">
              Fast calculators, a clean recipe builder, and opinionated defaults
              so you can focus on the craft.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Link to="/recipes" className="btn-neon">
                Start a Recipe
              </Link>
              <Link
                to="/calculators"
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-white/15"
              >
                Open Calculators
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium">ABV</div>
              <div className="text-white/60">OG/FG quick math</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium">Strike Temp</div>
              <div className="text-white/60">Mash-in target</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
              <div className="font-medium">IBU</div>
              <div className="text-white/60">Tinseth est.</div>
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
              <div className="font-medium mb-1">Calculators</div>
              <div className="text-sm text-white/70">
                ABV, IBU, SRM, Strike Temp, Priming
              </div>
            </div>
            <span className="text-white/30">→</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
