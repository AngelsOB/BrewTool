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
        <div className="font-medium text-strong">{title}</div>
        <div className="text-muted opacity-50">{right ?? "→"}</div>
      </header>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}
