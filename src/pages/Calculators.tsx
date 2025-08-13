import CalculatorCard from "../components/CalculatorCard";

export default function Calculators() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Calculators</h1>
        <p className="mt-1 text-white/70 text-sm">
          Quick brewing helpers. More coming soon.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorCard title="ABV">
          <div className="text-sm text-white/70">Coming next.</div>
        </CalculatorCard>
        <CalculatorCard title="IBU">
          <div className="text-sm text-white/70">Coming next.</div>
        </CalculatorCard>
        <CalculatorCard title="SRM">
          <div className="text-sm text-white/70">Coming next.</div>
        </CalculatorCard>
        <CalculatorCard title="Strike Water Temp">
          <div className="text-sm text-white/70">Coming next.</div>
        </CalculatorCard>
        <CalculatorCard title="Priming Sugar">
          <div className="text-sm text-white/70">Coming next.</div>
        </CalculatorCard>
      </div>
    </div>
  );
}
