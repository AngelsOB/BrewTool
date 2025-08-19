import React from "react";

type Props = {
  open: boolean;
  children: React.ReactNode;
  duration?: number; // ms
};

// Grid-based collapsible: animates grid-template-rows from 0fr → 1fr without measuring.
export default function Collapsible({ open, children, duration = 250 }: Props) {
  const transition = `${duration}ms ease-in-out`;
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: `grid-template-rows ${transition}`,
      }}
    >
      <div
        className="overflow-hidden"
        style={{ opacity: open ? 1 : 0, transition: `opacity ${transition}` }}
      >
        {children}
      </div>
    </div>
  );
}
