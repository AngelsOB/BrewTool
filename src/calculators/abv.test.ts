import { describe, test, expect } from 'vitest';
import { abvFromOGFG, abvMorey } from './abv';

describe('ABV Calculations', () => {
  describe('abvFromOGFG (simple formula)', () => {
    test('returns 0 when OG equals FG', () => {
      expect(abvFromOGFG(1.050, 1.050)).toBe(0);
    });

    test('calculates ABV for typical ale', () => {
      // OG 1.050, FG 1.010 → (0.040) × 131.25 = 5.25%
      const abv = abvFromOGFG(1.050, 1.010);
      expect(abv).toBeCloseTo(5.25, 2);
    });

    test('calculates ABV for light beer', () => {
      // OG 1.035, FG 1.005 → (0.030) × 131.25 = 3.9375%
      const abv = abvFromOGFG(1.035, 1.005);
      expect(abv).toBeCloseTo(3.94, 2);
    });

    test('calculates ABV for strong beer', () => {
      // OG 1.090, FG 1.015 → (0.075) × 131.25 = 9.84375%
      const abv = abvFromOGFG(1.090, 1.015);
      expect(abv).toBeCloseTo(9.84, 2);
    });

    test('calculates ABV for imperial stout', () => {
      // OG 1.110, FG 1.025 → (0.085) × 131.25 = 11.16%
      const abv = abvFromOGFG(1.110, 1.025);
      expect(abv).toBeCloseTo(11.16, 2);
    });

    test('handles very low gravity difference', () => {
      // OG 1.040, FG 1.038 → (0.002) × 131.25 = 0.2625%
      const abv = abvFromOGFG(1.040, 1.038);
      expect(abv).toBeCloseTo(0.26, 2);
    });

    test('handles FG equal to 1.000 (complete attenuation)', () => {
      // OG 1.050, FG 1.000 → (0.050) × 131.25 = 6.5625%
      const abv = abvFromOGFG(1.050, 1.000);
      expect(abv).toBeCloseTo(6.56, 2);
    });

    test('returns positive value when OG > FG', () => {
      const abv = abvFromOGFG(1.060, 1.012);
      expect(abv).toBeGreaterThan(0);
    });

    test('returns negative value when FG > OG (invalid but handled)', () => {
      // This shouldn't happen in practice, but the formula handles it
      const abv = abvFromOGFG(1.010, 1.050);
      expect(abv).toBeLessThan(0);
    });
  });

  describe('abvMorey (alternative formula)', () => {
    test('returns a value for typical beer', () => {
      // The Morey formula is more complex, just ensure it returns something
      const abv = abvMorey(1.050, 1.010);
      expect(abv).toBeGreaterThan(0);
    });

    test('returns 0 when OG equals FG', () => {
      // When OG = FG, numerator is 0
      const abv = abvMorey(1.050, 1.050);
      expect(abv).toBe(0);
    });

    test('generally agrees with simple formula direction', () => {
      // Both formulas should indicate higher ABV for larger OG-FG gap
      const simpleHigh = abvFromOGFG(1.080, 1.010);
      const simpleLow = abvFromOGFG(1.040, 1.010);
      const moreyHigh = abvMorey(1.080, 1.010);
      const moreyLow = abvMorey(1.040, 1.010);

      expect(simpleHigh).toBeGreaterThan(simpleLow);
      expect(moreyHigh).toBeGreaterThan(moreyLow);
    });
  });

  describe('Edge cases', () => {
    test('handles very high gravity wort', () => {
      // Belgian quadrupel territory
      const abv = abvFromOGFG(1.120, 1.020);
      expect(abv).toBeCloseTo(13.125, 2);
    });

    test('handles session beer range', () => {
      // Low ABV session beer
      const abv = abvFromOGFG(1.032, 1.008);
      expect(abv).toBeCloseTo(3.15, 2);
    });
  });
});
