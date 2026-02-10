import { describe, test, expect } from 'vitest';
import {
  tinsethGravityFactor,
  tinsethTimeFactor,
  tinsethUtilization,
  whirlpoolUtilization,
  ibuSingleAddition,
  ibuTotal,
  type HopAddition,
} from './ibu';

describe('Tinseth IBU Calculations', () => {
  describe('tinsethGravityFactor', () => {
    test('returns 1.65 for wort at SG 1.000', () => {
      // At SG 1.000: 1.65 * 0.000125^0 = 1.65
      expect(tinsethGravityFactor(1.0)).toBeCloseTo(1.65, 2);
    });

    test('decreases with higher gravity (less utilization)', () => {
      const lowGravity = tinsethGravityFactor(1.040);
      const highGravity = tinsethGravityFactor(1.080);
      expect(lowGravity).toBeGreaterThan(highGravity);
    });

    test('returns expected value for typical wort gravity', () => {
      // At 1.050, factor should be around 1.22-1.24
      const factor = tinsethGravityFactor(1.050);
      expect(factor).toBeGreaterThan(1.0);
      expect(factor).toBeLessThan(1.5);
    });
  });

  describe('tinsethTimeFactor', () => {
    test('returns 0 for 0 minutes', () => {
      expect(tinsethTimeFactor(0)).toBeCloseTo(0, 5);
    });

    test('increases with boil time', () => {
      const short = tinsethTimeFactor(15);
      const medium = tinsethTimeFactor(30);
      const long = tinsethTimeFactor(60);
      expect(short).toBeLessThan(medium);
      expect(medium).toBeLessThan(long);
    });

    test('approaches maximum around 0.24 for long boils', () => {
      // (1 - e^(-0.04*120)) / 4.15 ≈ 0.236
      const factor = tinsethTimeFactor(120);
      expect(factor).toBeCloseTo(0.236, 2);
    });

    test('returns expected value for 60 minute boil', () => {
      // (1 - e^(-2.4)) / 4.15 ≈ 0.219
      const factor = tinsethTimeFactor(60);
      expect(factor).toBeGreaterThan(0.2);
      expect(factor).toBeLessThan(0.25);
    });
  });

  describe('tinsethUtilization', () => {
    test('returns 0 for 0 minute boil', () => {
      expect(tinsethUtilization(0, 1.050)).toBeCloseTo(0, 5);
    });

    test('increases with time', () => {
      const short = tinsethUtilization(15, 1.050);
      const long = tinsethUtilization(60, 1.050);
      expect(short).toBeLessThan(long);
    });

    test('decreases with higher gravity', () => {
      const low = tinsethUtilization(60, 1.040);
      const high = tinsethUtilization(60, 1.080);
      expect(low).toBeGreaterThan(high);
    });

    test('returns reasonable utilization for typical 60 min / 1.050 wort', () => {
      // Expected ~25-27% utilization
      const util = tinsethUtilization(60, 1.050);
      expect(util).toBeGreaterThan(0.2);
      expect(util).toBeLessThan(0.3);
    });
  });

  describe('whirlpoolUtilization', () => {
    test('returns 0 at 60°C or below', () => {
      expect(whirlpoolUtilization(30, 60, 1.050)).toBe(0);
      expect(whirlpoolUtilization(30, 50, 1.050)).toBe(0);
    });

    test('increases with temperature above 60°C', () => {
      const cool = whirlpoolUtilization(30, 70, 1.050);
      const warm = whirlpoolUtilization(30, 85, 1.050);
      const hot = whirlpoolUtilization(30, 95, 1.050);
      expect(cool).toBeLessThan(warm);
      expect(warm).toBeLessThan(hot);
    });

    test('equals Tinseth utilization at 100°C', () => {
      const wpUtil = whirlpoolUtilization(30, 100, 1.050);
      const tinsUtil = tinsethUtilization(30, 1.050);
      expect(wpUtil).toBeCloseTo(tinsUtil, 5);
    });

    test('clamps temperature to 60-100 range', () => {
      // Above 100 should behave same as 100
      const at100 = whirlpoolUtilization(30, 100, 1.050);
      const above100 = whirlpoolUtilization(30, 110, 1.050);
      expect(above100).toBeCloseTo(at100, 5);
    });
  });

  describe('ibuSingleAddition', () => {
    const baseAddition: HopAddition = {
      weightGrams: 28,
      alphaAcidPercent: 10,
      boilTimeMinutes: 60,
      type: 'boil',
    };

    test('calculates IBU for standard boil addition', () => {
      const ibu = ibuSingleAddition(baseAddition, 20, 1.050);
      // 28g * 10% * 1000 * ~0.27 util / 20L ≈ 37 IBU
      expect(ibu).toBeGreaterThan(30);
      expect(ibu).toBeLessThan(50);
    });

    test('returns higher IBU for first wort (10% boost)', () => {
      const boilIbu = ibuSingleAddition(baseAddition, 20, 1.050);
      const fwhAddition: HopAddition = { ...baseAddition, type: 'first wort' };
      const fwhIbu = ibuSingleAddition(fwhAddition, 20, 1.050);
      expect(fwhIbu).toBeCloseTo(boilIbu * 1.1, 1);
    });

    test('returns minimal IBU for dry hop (5% of potential)', () => {
      const dryHopAddition: HopAddition = { ...baseAddition, type: 'dry hop' };
      const ibu = ibuSingleAddition(dryHopAddition, 20, 1.050);
      const fullPotentialIbu = ibuSingleAddition(baseAddition, 20, 1.050);
      expect(ibu).toBeLessThan(fullPotentialIbu * 0.1);
    });

    test('returns low IBU for mash hops (15% of boil)', () => {
      const mashAddition: HopAddition = { ...baseAddition, type: 'mash' };
      const ibu = ibuSingleAddition(mashAddition, 20, 1.050);
      const boilIbu = ibuSingleAddition(baseAddition, 20, 1.050);
      expect(ibu).toBeCloseTo(boilIbu * 0.15, 1);
    });

    test('calculates whirlpool IBU with temperature factor', () => {
      const wpAddition: HopAddition = {
        ...baseAddition,
        type: 'whirlpool',
        whirlpoolTimeMinutes: 30,
        whirlpoolTempC: 80,
      };
      const ibu = ibuSingleAddition(wpAddition, 20, 1.050);
      // Should be less than boil but more than dry hop
      expect(ibu).toBeGreaterThan(0);
      expect(ibu).toBeLessThan(ibuSingleAddition(baseAddition, 20, 1.050));
    });

    test('scales linearly with hop weight', () => {
      const single = ibuSingleAddition(baseAddition, 20, 1.050);
      const double: HopAddition = { ...baseAddition, weightGrams: 56 };
      const doubleIbu = ibuSingleAddition(double, 20, 1.050);
      expect(doubleIbu).toBeCloseTo(single * 2, 1);
    });

    test('scales linearly with alpha acid', () => {
      const low: HopAddition = { ...baseAddition, alphaAcidPercent: 5 };
      const high: HopAddition = { ...baseAddition, alphaAcidPercent: 15 };
      const lowIbu = ibuSingleAddition(low, 20, 1.050);
      const highIbu = ibuSingleAddition(high, 20, 1.050);
      expect(highIbu).toBeCloseTo(lowIbu * 3, 1);
    });

    test('inversely scales with volume', () => {
      const small = ibuSingleAddition(baseAddition, 10, 1.050);
      const large = ibuSingleAddition(baseAddition, 20, 1.050);
      expect(small).toBeCloseTo(large * 2, 1);
    });
  });

  describe('ibuTotal', () => {
    test('sums IBU from multiple additions', () => {
      const additions: HopAddition[] = [
        { weightGrams: 28, alphaAcidPercent: 10, boilTimeMinutes: 60, type: 'boil' },
        { weightGrams: 14, alphaAcidPercent: 5, boilTimeMinutes: 15, type: 'boil' },
      ];
      const total = ibuTotal(additions, 20, 1.050);
      const first = ibuSingleAddition(additions[0], 20, 1.050);
      const second = ibuSingleAddition(additions[1], 20, 1.050);
      expect(total).toBeCloseTo(first + second, 5);
    });

    test('returns 0 for empty additions', () => {
      expect(ibuTotal([], 20, 1.050)).toBe(0);
    });

    test('handles mixed hop types', () => {
      const additions: HopAddition[] = [
        { weightGrams: 28, alphaAcidPercent: 12, boilTimeMinutes: 60, type: 'boil' },
        { weightGrams: 28, alphaAcidPercent: 12, boilTimeMinutes: 60, type: 'first wort' },
        { weightGrams: 56, alphaAcidPercent: 6, boilTimeMinutes: 0, type: 'dry hop' },
        { weightGrams: 28, alphaAcidPercent: 8, boilTimeMinutes: 0, type: 'whirlpool', whirlpoolTimeMinutes: 20, whirlpoolTempC: 80 },
      ];
      const total = ibuTotal(additions, 20, 1.050);
      // Boil hops dominate, dry hop minimal
      expect(total).toBeGreaterThan(50);
      expect(total).toBeLessThan(150);
    });
  });

  describe('Input Validation - Edge Cases', () => {
    const validAddition: HopAddition = {
      weightGrams: 28,
      alphaAcidPercent: 10,
      boilTimeMinutes: 60,
      type: 'boil',
    };

    describe('tinsethGravityFactor', () => {
      test('returns 0 for NaN gravity', () => {
        expect(tinsethGravityFactor(NaN)).toBe(0);
      });

      test('returns 0 for Infinity gravity', () => {
        expect(tinsethGravityFactor(Infinity)).toBe(0);
        expect(tinsethGravityFactor(-Infinity)).toBe(0);
      });
    });

    describe('tinsethTimeFactor', () => {
      test('returns 0 for NaN minutes', () => {
        expect(tinsethTimeFactor(NaN)).toBe(0);
      });

      test('returns 0 for negative minutes', () => {
        expect(tinsethTimeFactor(-10)).toBe(0);
      });

      test('returns 0 for Infinity minutes', () => {
        expect(tinsethTimeFactor(Infinity)).toBe(0);
      });
    });

    describe('whirlpoolUtilization', () => {
      test('returns 0 for NaN temperature', () => {
        expect(whirlpoolUtilization(30, NaN, 1.050)).toBe(0);
      });

      test('returns 0 for Infinity temperature', () => {
        expect(whirlpoolUtilization(30, Infinity, 1.050)).toBe(0);
      });
    });

    describe('ibuSingleAddition - volume validation', () => {
      test('returns 0 for zero volume (prevents division by zero)', () => {
        expect(ibuSingleAddition(validAddition, 0, 1.050)).toBe(0);
      });

      test('returns 0 for negative volume', () => {
        expect(ibuSingleAddition(validAddition, -20, 1.050)).toBe(0);
      });

      test('returns 0 for NaN volume', () => {
        expect(ibuSingleAddition(validAddition, NaN, 1.050)).toBe(0);
      });

      test('returns 0 for Infinity volume', () => {
        expect(ibuSingleAddition(validAddition, Infinity, 1.050)).toBe(0);
      });
    });

    describe('ibuSingleAddition - weight validation', () => {
      test('returns 0 for zero weight', () => {
        const zeroWeight = { ...validAddition, weightGrams: 0 };
        expect(ibuSingleAddition(zeroWeight, 20, 1.050)).toBe(0);
      });

      test('returns 0 for negative weight', () => {
        const negativeWeight = { ...validAddition, weightGrams: -28 };
        expect(ibuSingleAddition(negativeWeight, 20, 1.050)).toBe(0);
      });

      test('returns 0 for NaN weight', () => {
        const nanWeight = { ...validAddition, weightGrams: NaN };
        expect(ibuSingleAddition(nanWeight, 20, 1.050)).toBe(0);
      });
    });

    describe('ibuSingleAddition - alpha acid validation', () => {
      test('returns 0 for negative alpha acid', () => {
        const negativeAA = { ...validAddition, alphaAcidPercent: -5 };
        expect(ibuSingleAddition(negativeAA, 20, 1.050)).toBe(0);
      });

      test('returns 0 for NaN alpha acid', () => {
        const nanAA = { ...validAddition, alphaAcidPercent: NaN };
        expect(ibuSingleAddition(nanAA, 20, 1.050)).toBe(0);
      });

      test('handles zero alpha acid (valid edge case, returns 0 IBU)', () => {
        const zeroAA = { ...validAddition, alphaAcidPercent: 0 };
        expect(ibuSingleAddition(zeroAA, 20, 1.050)).toBe(0);
      });

      test('handles high alpha acid values (e.g., 20%)', () => {
        const highAA = { ...validAddition, alphaAcidPercent: 20 };
        const ibu = ibuSingleAddition(highAA, 20, 1.050);
        expect(ibu).toBeGreaterThan(0);
        expect(Number.isFinite(ibu)).toBe(true);
      });
    });

    describe('ibuSingleAddition - gravity validation', () => {
      test('returns 0 for NaN gravity', () => {
        expect(ibuSingleAddition(validAddition, 20, NaN)).toBe(0);
      });

      test('returns 0 for Infinity gravity', () => {
        expect(ibuSingleAddition(validAddition, 20, Infinity)).toBe(0);
      });

      test('handles extreme low gravity (edge case)', () => {
        // Very low gravity (like 1.000) is valid but unusual
        const ibu = ibuSingleAddition(validAddition, 20, 1.000);
        expect(Number.isFinite(ibu)).toBe(true);
        expect(ibu).toBeGreaterThan(0);
      });

      test('handles extreme high gravity (edge case)', () => {
        // Very high gravity (like 1.150) is valid for barleywines
        const ibu = ibuSingleAddition(validAddition, 20, 1.150);
        expect(Number.isFinite(ibu)).toBe(true);
        expect(ibu).toBeGreaterThan(0);
      });
    });

    describe('ibuTotal - edge cases', () => {
      test('handles null-like additions array', () => {
        // TypeScript prevents null, but at runtime could happen
        expect(ibuTotal(null as unknown as HopAddition[], 20, 1.050)).toBe(0);
        expect(ibuTotal(undefined as unknown as HopAddition[], 20, 1.050)).toBe(0);
      });

      test('filters out invalid additions within array', () => {
        const mixedAdditions: HopAddition[] = [
          validAddition, // valid
          { ...validAddition, weightGrams: -10 }, // invalid weight
          { ...validAddition, alphaAcidPercent: NaN }, // invalid AA
        ];
        // Only the first valid addition should contribute
        const total = ibuTotal(mixedAdditions, 20, 1.050);
        const single = ibuSingleAddition(validAddition, 20, 1.050);
        expect(total).toBeCloseTo(single, 5);
      });

      test('returns 0 for all invalid additions', () => {
        const invalidAdditions: HopAddition[] = [
          { ...validAddition, weightGrams: 0 },
          { ...validAddition, alphaAcidPercent: -5 },
        ];
        expect(ibuTotal(invalidAdditions, 20, 1.050)).toBe(0);
      });
    });
  });
});
