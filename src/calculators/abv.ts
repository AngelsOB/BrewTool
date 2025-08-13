// Simple ABV approximations
export function abvFromOGFG(og: number, fg: number): number {
  // Common simple formula
  return (og - fg) * 131.25;
}

export function abvMorey(og: number, fg: number): number {
  // Morey formula approximation in ABW -> ABV conversion
  const abw = ((76.08 * (og - fg)) / (1.775 - og)) * (fg / 0.794);
  return abw * (fg / 0.794);
}
