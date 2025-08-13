import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function CalculatorCard({ title, children }: Props) {
  return (
    <section className="group relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-neutral-900/5" />
      <header className="mb-2 flex items-center justify-between">
        <div className="font-medium text-neutral-900">{title}</div>
        <div className="text-neutral-300 transition-transform group-hover:translate-x-0.5">→</div>
      </header>
      <div className="space-y-3 text-neutral-700">{children}</div>
    </section>
  );
}
