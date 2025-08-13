import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/60 p-6 sm:p-10 shadow-sm">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neutral-900/5 rounded-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Brew better beer.
            </h1>
            <p className="mt-3 max-w-prose text-neutral-600 text-sm sm:text-base">
              Fast calculators, a clean recipe builder, and opinionated defaults
              so you can focus on the craft.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Link
                to="/recipes"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-white text-sm font-medium shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Start a Recipe
              </Link>
              <Link
                to="/calculators"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Open Calculators
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm">
              <div className="font-medium">ABV</div>
              <div className="text-neutral-600">OG/FG quick math</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm">
              <div className="font-medium">Strike Temp</div>
              <div className="text-neutral-600">Mash-in target</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm">
              <div className="font-medium">IBU</div>
              <div className="text-neutral-600">Tinseth est.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/calculators"
          className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-neutral-900 mb-1">
                Calculators
              </div>
              <div className="text-sm text-neutral-600">
                ABV, IBU, SRM, Strike Temp, Priming
              </div>
            </div>
            <span className="text-neutral-400 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
