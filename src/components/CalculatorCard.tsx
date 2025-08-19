import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  right?: ReactNode;
};

export default function CalculatorCard({ title, children, right }: Props) {
  return (
    <section className="card-glass card-inner-ring p-5 neon-glow">
      <header className="mb-2 flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div className="text-white/30">{right ?? "→"}</div>
      </header>
      <div className="space-y-3 text-white/80">{children}</div>
    </section>
  );
}
