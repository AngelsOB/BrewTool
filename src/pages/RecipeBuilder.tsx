export default function RecipeBuilder() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recipe Builder
          </h1>
          <p className="mt-1 text-neutral-600 text-sm">
            Start a new recipe or pick up where you left off.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center rounded-lg bg-neutral-900 text-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2">
            New Recipe
          </button>
          <button className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
            Import
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="text-sm text-neutral-600">
          MVP scaffold. We'll wire storage and calculators next.
        </div>
      </div>
    </div>
  );
}
