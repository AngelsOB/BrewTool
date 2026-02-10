// Simple ABV approximation using the standard formula
export function abvFromOGFG(og: number, fg: number): number {
  return (og - fg) * 131.25;
}
