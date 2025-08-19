import { useLayoutEffect, useRef, useState } from "react";

type FitToWidthProps = {
  children: React.ReactNode;
  /** Minimum scale allowed (SwiftUI's minimumScaleFactor). 0.75 => shrink to 75% at most. */
  minScale?: number;
  /** Alignment used for transform origin and justification */
  align?: "left" | "center" | "right";
  /** Optional className for the outer container */
  className?: string;
};

export default function FitToWidth({
  children,
  minScale = 0.75,
  align = "left",
  className,
}: FitToWidthProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const recompute = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      if (!containerWidth || !contentWidth) {
        setScale(1);
        return;
      }
      const raw = containerWidth / contentWidth;
      const next = Math.max(minScale, Math.min(1, raw));
      setScale(next);
    };

    // Initial compute
    recompute();

    // Observe size changes
    const ro = new ResizeObserver(() => recompute());
    ro.observe(container);
    ro.observe(content);

    // Also watch for text/content mutations that change intrinsic width
    const mo = new MutationObserver(() => recompute());
    mo.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [minScale]);

  const justify =
    align === "right"
      ? "flex-end"
      : align === "center"
      ? "center"
      : "flex-start";
  const origin =
    align === "right" ? "100% 50%" : align === "center" ? "50% 50%" : "0% 50%";

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "flex",
        minWidth: 0,
        justifyContent: justify,
        overflow: "visible",
      }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: origin,
          whiteSpace: scale < 1 ? "nowrap" : undefined,
          display: "inline-flex",
        }}
      >
        {children}
      </div>
    </div>
  );
}
