import CalculatorCard from "../components/CalculatorCard";

export default function Calculators() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CalculatorCard title="ABV">
        <div className="text-sm text-neutral-600">Coming next.</div>
      </CalculatorCard>
      <CalculatorCard title="IBU">
        <div className="text-sm text-neutral-600">Coming next.</div>
      </CalculatorCard>
      <CalculatorCard title="SRM">
        <div className="text-sm text-neutral-600">Coming next.</div>
      </CalculatorCard>
      <CalculatorCard title="Strike Water Temp">
        <div className="text-sm text-neutral-600">Coming next.</div>
      </CalculatorCard>
      <CalculatorCard title="Priming Sugar">
        <div className="text-sm text-neutral-600">Coming next.</div>
      </CalculatorCard>
    </div>
  );
}
