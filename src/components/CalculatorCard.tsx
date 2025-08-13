import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function CalculatorCard({ title, children }: Props) {
  return (
    <section className="rounded border bg-white p-4 shadow-sm">
      <header className="font-medium mb-2">{title}</header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
