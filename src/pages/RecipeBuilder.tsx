export default function RecipeBuilder() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recipe Builder
          </h1>
          <p className="mt-1 text-white/70 text-sm">
            Start a new recipe or pick up where you left off.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-neon">New Recipe</button>
          <button className="inline-flex items-center rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-soft hover:bg-white/15">
            Import
          </button>
        </div>
      </div>

      <div className="card-glass card-inner-ring p-4 sm:p-6">
        <div className="text-sm text-white/70">
          MVP scaffold. We'll wire storage and calculators next.
        </div>
      </div>
    </div>
  );
}
