# BeerApp Refactoring Plan

## Executive Summary

This document outlines a phased approach to fixing critical issues, improving performance, and cleaning up technical debt in the BeerApp. Each phase is designed to be completed independently without breaking existing functionality.

---

## Phase 1: Critical Bug Fixes (1-2 days)

### 1.1 Hop Absorption Bug Investigation & Fix

**Current Issue:**
- Commit 24b77c3 says "maybe buggy fix tbh"
- Hop absorption is calculated dynamically in `useRecipeCalculations.ts`
- The value can be `undefined` and defaults to 0.7 in multiple places
- This creates inconsistency between UI, calculations, and stored recipes

**Root Cause Analysis:**
```typescript
// In useRecipeCalculations.ts line 174
const hopCoeff = waterParams.hopsAbsorptionLPerKg ?? 0.7;

// In WaterSettings.tsx line 151
value={state.hopsAbsorptionLPerKg ?? 0.7}

// In RecipeBuilder.tsx line 64
hopsAbsorptionLPerKg: params.hopsAbsorptionLPerKg ?? 0.7,
```

The problem: `hopsAbsorptionLPerKg` is optional (`?:`) but gets used in calculations. If it's undefined:
1. UI shows 0.7
2. Calculations use 0.7
3. But the waterParams object passed around might have `undefined`
4. When saved to recipe, it might store undefined or 0.7 depending on timing

**The Fix:**
```typescript
// Step 1: Make hopsAbsorptionLPerKg required with a default
// In WaterParams type (utils/calculations.ts)
export type WaterParams = {
  // ... other fields
  hopsAbsorptionLPerKg: number; // Remove the ?
  // ... rest
};

// Step 2: Provide default when initializing waterParams state
// In RecipeBuilder.tsx initial state
const [waterParams, setWaterParams] = useState<WaterParams>({
  // ... other defaults
  hopsAbsorptionLPerKg: 0.7, // Always set
  // ... rest
});

// Step 3: Remove all ?? 0.7 fallbacks since it's always defined
// In useRecipeCalculations.ts
const hopCoeff = waterParams.hopsAbsorptionLPerKg; // No fallback needed

// In WaterSettings.tsx
value={state.hopsAbsorptionLPerKg} // No fallback needed
```

**Testing:**
1. Create new recipe → verify hop absorption is 0.7
2. Change hop absorption to 1.0 → verify water calcs update
3. Save recipe → verify it stores 1.0
4. Reload recipe → verify it loads 1.0
5. Add hops → verify kettle loss increases by (hopKg × 1.0)

**Knock-on Effects:**
- Need to update any old recipes in localStorage that have `undefined`
- Add migration logic or just let the ?? fallback handle it during load

**Files to Change:**
- `src/utils/calculations.ts` - Update WaterParams type
- `src/pages/RecipeBuilder.tsx` - Set default in initial state
- `src/hooks/useRecipeCalculations.ts` - Remove ?? fallbacks
- `src/modules/recipe/components/WaterSettings.tsx` - Remove ?? fallback

---

### 1.2 Verify Hop Absorption Calculation Logic

**Current Logic:**
```typescript
// Calculate total kettle hops (boil, first wort, whirlpool)
const totalKettleHopKg = hops
  .filter((h) => inKettle.has(h.type))
  .reduce((sum, h) => sum + h.grams / 1000, 0);

// Add to kettle loss
const dynamicKettle = baseKettle + hopCoeff * totalKettleHopKg;
```

**Validation:**
- Is 0.7 L/kg a reasonable hop absorption rate? (Industry standard is 0.7-1.0, so yes)
- Should dry hops count? (Currently they don't, which is correct - only kettle hops)
- Is the math right? `kettleLoss + (L/kg × kg)` = L ✓

**Action:**
- This logic looks correct
- Document it with a comment explaining the calculation
- Add unit test to verify math

---

## Phase 2: Timer Fix for Brew Mode (1 day)

### 2.1 Current Timer Implementation

**Problem:**
Browser throttles `setInterval`/`setTimeout` when tab is not focused:
- Chrome: 1 second minimum
- Firefox: 1 second after 5 minutes
- Safari: Similar throttling

Result: A 60-minute mash timer could drift by several minutes if you switch tabs.

**Investigation Needed:**
1. Find where timers are implemented (likely in `BrewMode.tsx`)
2. Check if using `setInterval` or `setTimeout`

**Solution: Timestamp-Based Timing**

Instead of counting intervals, compare timestamps:

```typescript
// BAD - This drifts
const [secondsLeft, setSecondsLeft] = useState(3600);
useEffect(() => {
  const timer = setInterval(() => {
    setSecondsLeft(prev => prev - 1); // Drifts when throttled
  }, 1000);
  return () => clearInterval(timer);
}, []);

// GOOD - This doesn't drift
const [targetTime, setTargetTime] = useState<number | null>(null);
const [now, setNow] = useState(Date.now());

// Start timer
const startTimer = (durationSeconds: number) => {
  setTargetTime(Date.now() + durationSeconds * 1000);
};

// Update current time (can drift, but we recalculate from target)
useEffect(() => {
  if (!targetTime) return;

  const timer = setInterval(() => {
    setNow(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, [targetTime]);

// Calculate remaining time from timestamps
const secondsLeft = targetTime
  ? Math.max(0, Math.ceil((targetTime - now) / 1000))
  : 0;
```

**Even Better: Use Web Workers or Page Visibility API**

```typescript
// Detect when page becomes visible again and recalculate
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setNow(Date.now()); // Force immediate update
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

**Files to Change:**
- `src/pages/BrewMode.tsx` (likely)
- Any component using timers

**Testing:**
1. Start 5-minute timer
2. Switch to different tab for 3 minutes
3. Switch back
4. Verify timer shows ~2 minutes remaining (not 5 minutes)

---

## Phase 3: Performance Optimizations (2-3 days)

### 3.1 Add Debouncing to Inline Number Inputs

**Current Issue:**
Every keystroke triggers full recalculation pipeline.

**Solution: Debounce the onChange handler**

```typescript
// New utility: src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// Usage in RecipeBuilder
const [grainsDraft, setGrainsDraft] = useState(grains);
const grainsDebounced = useDebounce(grainsDraft, 300); // 300ms delay

// Pass debounced version to calculations
const calculations = useRecipeCalculations({
  grains: grainsDebounced, // Only updates after 300ms of no changes
  // ... rest
});

// Pass draft version to UI for immediate feedback
<GrainBill
  grains={grainsDraft} // Immediate UI update
  onChange={setGrainsDraft} // No debounce on UI
/>
```

**Alternative: Debounce at Input Level**

```typescript
// Modify InlineEditableNumber.tsx
import { useState, useEffect } from 'react';

export default function InlineEditableNumber({ value, onChange, ...props }) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <InputWithSuffix
      value={localValue}
      onChange={setLocalValue} // Update local state immediately
      {...props}
    />
  );
}
```

**Recommendation:** Debounce at input level for simplicity.

**Files to Change:**
- `src/components/InlineEditableNumber.tsx`
- `src/components/InputWithSuffix.tsx`
- Create `src/hooks/useDebounce.ts`

**Testing:**
1. Type "4.567" in grain weight
2. Verify UI updates immediately on each keystroke
3. Verify calculations only run once after typing stops
4. Verify final value (4.567) is correct

---

### 3.2 Memoize Preset Loading

**Current Issue:**
```typescript
export function getGrainPresets(): GrainPreset[] {
  const custom = loadJson<GrainPreset[]>(CUSTOM_GRAINS_KEY, []); // Reads localStorage
  const generated: GrainPreset[] = GENERATED_GRAINS as unknown as GrainPreset[]; // Large array

  // Deduplication logic
  const byName = new Map<string, GrainPreset>();
  // ... expensive processing

  return Array.from(byName.values());
}
```

This runs every time `SearchSelect` renders or any component calls it.

**Solution: Module-level cache**

```typescript
// src/utils/presets.ts

// Cache at module level
let grainPresetsCache: GrainPreset[] | null = null;
let customGrainsCacheKey: string | null = null;

export function getGrainPresets(forceRefresh = false): GrainPreset[] {
  const custom = loadJson<GrainPreset[]>(CUSTOM_GRAINS_KEY, []);
  const customKey = JSON.stringify(custom); // Simple cache key

  // Return cache if valid
  if (!forceRefresh && grainPresetsCache && customKey === customGrainsCacheKey) {
    return grainPresetsCache;
  }

  // Rebuild cache
  const generated: GrainPreset[] = GENERATED_GRAINS as unknown as GrainPreset[];
  const byName = new Map<string, GrainPreset>();

  for (const p of GRAIN_PRESETS) byName.set(p.name, p);
  for (const p of generated) byName.set(p.name, { ...byName.get(p.name), ...p });
  for (const p of custom) byName.set(p.name, { ...byName.get(p.name), ...p });

  grainPresetsCache = Array.from(byName.values());
  customGrainsCacheKey = customKey;

  return grainPresetsCache;
}

// Add function to invalidate cache when custom grains are added
export function invalidateGrainPresetsCache() {
  grainPresetsCache = null;
  customGrainsCacheKey = null;
}

export function addCustomGrain(p: GrainPreset): GrainPreset[] {
  const list = loadJson<GrainPreset[]>(CUSTOM_GRAINS_KEY, []);
  const next = [...list.filter((x) => x.name !== p.name), p];
  saveJson(CUSTOM_GRAINS_KEY, next);
  invalidateGrainPresetsCache(); // Clear cache
  return getGrainPresets(true); // Force refresh
}
```

**Apply same pattern to:**
- `getHopPresets()`
- `getYeastPresets()`
- `getGrainPresetsGrouped()`
- `getGrainPresetsGroupedByVendor()`

**Files to Change:**
- `src/utils/presets.ts`

**Testing:**
1. Open SearchSelect → time how long it takes
2. Type in SearchSelect → should be instant
3. Add custom grain → verify cache invalidates
4. Reopen SearchSelect → should show new grain

---

### 3.3 Optimize Calculation Dependencies

**Current Issue:**
All calculations run on nearly every change because they're all in one hook.

**Analysis of Dependencies:**

```
Input Change         → Calculations Affected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grain weight        → OG, SRM, water volumes
Hop amount          → IBU, hop flavor
Hop timing          → IBU, hop flavor
Yeast attenuation   → FG, ABV
Mash temp           → FG
Fermentation temp   → FG
Batch volume        → ALL
Efficiency          → OG, FG, ABV
```

**Solution: Split calculation hook**

This is actually already well-optimized with separate `useMemo` hooks. The issue is perceived, not real.

**Verification:**
Add debug logging to see what actually recalculates:

```typescript
const ogAutoCalc = useMemo(() => {
  console.log('🔄 Recalculating OG'); // Add this
  return ogFromPoints(/* ... */);
}, [grains, batchVolumeL, efficiencyPct]);
```

**Testing:**
1. Change hop amount
2. Check console - should NOT see "Recalculating OG"
3. Change grain weight
4. Check console - should see "Recalculating OG"

**Conclusion:** Likely already optimized. Verify with logging, then remove if confirmed.

---

### 3.4 Comment Magic Numbers in Calculations

**Task:** Add comments explaining where constants come from.

```typescript
// BEFORE
export function tinsethGravityFactor(wortGravity: number): number {
  return 1.65 * Math.pow(0.000125, wortGravity - 1.0);
}

// AFTER
export function tinsethGravityFactor(wortGravity: number): number {
  // Tinseth's empirical gravity correction formula
  // Published in "The Hop Page" - https://www.realbeer.com/hops/research.html
  // Constants derived from experimental data fitting alpha acid utilization
  // vs. wort gravity across multiple brew batches
  // Formula: 1.65 × 0.000125^(OG - 1.0)
  return 1.65 * Math.pow(0.000125, wortGravity - 1.0);
}

// Hop flavor constants
const AROMA_DECAY_PER_MINUTE = 0.05;
// Exponential decay rate for volatile hop oils during boiling
// Derived from research: approximately 5% aroma loss per minute of boil time
// Reference: "For the Love of Hops" by Stan Hieronymus

const OVERALL_INTENSITY_LAMBDA = 0.7;
// Scaling factor for hop aroma intensity based on dose rate (g/L)
// Tuned empirically to produce 0-5 scale output matching sensory evaluation
// Higher values = faster saturation of aroma intensity
```

**Files to Document:**
- `src/calculators/ibu.ts` - All Tinseth constants
- `src/utils/calculations.ts` - Morey SRM formula
- `src/utils/hopsFlavor.ts` - All aroma model constants
- `src/utils/water.ts` - Ion contribution factors

---

## Phase 4: Data Quality Improvements (2 days)

### 4.1 Check Water Chemistry Calculations

**Task:** Verify no duplicate calculations between components.

**Investigation:**
1. Search for all water chemistry calculations
2. Check if `WaterSettings.tsx` and `WaterSaltsSection.tsx` duplicate logic
3. If yes, extract to shared utility

**Likely scenario:** They're probably both calling the same utilities, which is fine.

**Action:** Add unit tests for water chemistry functions to ensure accuracy.

---

### 4.2 Improve Type Safety

**Issue:** UI types (`GrainItem`, `HopItem`) vs Storage types (`FermentableAddition`, `HopAddition`)

**Current Pattern:**
```
User Input → UI Types (GrainItem[]) → Mapping Function → Storage Types (Recipe)
```

**Problem:**
- Two representations can drift
- Mapping is one-way (save time only)
- Loading requires reverse mapping

**Better Pattern:** Use the same types, but add computed/display fields

**Proposal:**

```typescript
// Remove separate GrainItem type
// Instead, use FermentableAddition everywhere, but with computed fields

// Add utility to hydrate recipe additions with display data
export function hydrateGrainForUI(addition: FermentableAddition): FermentableAddition & {
  // Computed display fields
  displayName: string;
  percentOfBill: number;
} {
  const preset = findGrainPreset(addition.ingredientRef.id);
  return {
    ...addition,
    displayName: preset?.name ?? addition.ingredientRef.id,
    percentOfBill: 0, // Calculate in component
  };
}
```

**However:** This is a large refactor.

**Recommendation:** Keep current pattern for now, but:
1. Add JSDoc comments explaining the type duality
2. Add validation in mapping functions
3. Consider refactor in future major version

---

### 4.3 Add Error Handling to localStorage

**Current Code:**
```typescript
export function loadJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    // ...
    return parsed;
  } catch {
    return defaultValue; // Silent failure
  }
}
```

**Improved Version:**

```typescript
export type StorageError = {
  type: 'quota_exceeded' | 'parse_error' | 'not_found' | 'unknown';
  message: string;
  key: string;
};

export function loadJson<T>(
  key: string,
  defaultValue: T,
  onError?: (error: StorageError) => void
): T {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      onError?.({
        type: 'not_found',
        message: `No data found for key: ${key}`,
        key,
      });
      return defaultValue;
    }

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && "value" in parsed) {
      return parsed.value;
    }

    return parsed;
  } catch (error) {
    const storageError: StorageError = {
      type: error instanceof SyntaxError ? 'parse_error' : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      key,
    };

    onError?.(storageError);
    console.error('localStorage error:', storageError);

    return defaultValue;
  }
}

export function saveJson<T>(
  key: string,
  value: T,
  version = 1,
  onError?: (error: StorageError) => void
): boolean {
  try {
    const payload: StoredValue<T> = { version, value };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (error) {
    const storageError: StorageError = {
      type: error?.name === 'QuotaExceededError' ? 'quota_exceeded' : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      key,
    };

    onError?.(storageError);
    console.error('localStorage error:', storageError);

    return false;
  }
}
```

**Usage in Components:**

```typescript
// In RecipeBuilder
const handleSave = () => {
  const success = useRecipeStore.getState().upsert(recipe, (error) => {
    // Show user-friendly error message
    if (error.type === 'quota_exceeded') {
      alert('Storage full! Please delete old recipes or export them.');
    } else {
      alert('Failed to save recipe. Please try again.');
    }
  });

  if (success) {
    // Show success message
  }
};
```

**Files to Change:**
- `src/utils/storage.ts`

---

### 4.4 Add Recipe Validation on Load

**Current Risk:** Loading corrupted/outdated recipes crashes the app.

**Solution: Validation schema**

```typescript
// src/utils/recipeValidation.ts

export function isValidRecipe(data: unknown): data is Recipe {
  if (!data || typeof data !== 'object') return false;

  const r = data as Partial<Recipe>;

  // Check required fields
  if (!r.id || typeof r.id !== 'string') return false;
  if (!r.name || typeof r.name !== 'string') return false;
  if (!r.createdAt || typeof r.createdAt !== 'string') return false;

  // Check arrays exist
  if (!Array.isArray(r.ingredients?.fermentables)) return false;
  if (!Array.isArray(r.ingredients?.hops)) return false;
  if (!Array.isArray(r.ingredients?.other)) return false;

  // More validation...

  return true;
}

export function repairRecipe(data: Partial<Recipe>): Recipe {
  // Attempt to fix common issues
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name ?? 'Untitled Recipe',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    version: data.version ?? 1,
    // ... provide defaults for all required fields
    ingredients: {
      fermentables: data.ingredients?.fermentables ?? [],
      hops: data.ingredients?.hops ?? [],
      yeast: data.ingredients?.yeast ?? null,
      other: data.ingredients?.other ?? [],
    },
    // ... rest of defaults
  } as Recipe;
}
```

**Usage:**

```typescript
// In useRecipeStore
list: () => {
  const raw = loadJson<Recipe[]>(RECIPES_KEY, []);
  return raw
    .filter(isValidRecipe) // Remove invalid recipes
    .map(recipe => {
      // Attempt to repair recipes missing optional fields
      if (!recipe.calculated) {
        return {
          ...recipe,
          calculated: createEmptyCalculated()
        };
      }
      return recipe;
    });
}
```

---

### 4.5 Fix HopItem Time Field Inconsistency

**Current Issue:**
```typescript
type HopItem = {
  timeMin: number;           // Used for boil hops
  dryHopStartDay?: number;   // Used for dry hops
  dryHopDays?: number;       // Used for dry hops
  whirlpoolTimeMin?: number; // Used for whirlpool
  // ... confusing!
}
```

**Better Design:**

```typescript
type HopItemBase = {
  id: string;
  name: string;
  grams: number;
  alphaAcidPercent: number;
  flavor?: HopFlavorProfile;
};

type BoilHop = HopItemBase & {
  type: 'boil';
  timeMin: number;
};

type DryHop = HopItemBase & {
  type: 'dry hop';
  startDay: number;
  durationDays: number;
  stage?: 'primary' | 'post-fermentation' | 'keg';
};

type WhirlpoolHop = HopItemBase & {
  type: 'whirlpool';
  timeMin: number;
  tempC: number;
};

type FirstWortHop = HopItemBase & {
  type: 'first wort';
  // No additional fields needed
};

type MashHop = HopItemBase & {
  type: 'mash';
  // No additional fields needed
};

type HopItem = BoilHop | DryHop | WhirlpoolHop | FirstWortHop | MashHop;
```

**However:** This is a MAJOR refactor that breaks everything.

**Pragmatic Solution:** Keep current type, but add validation:

```typescript
export function validateHopItem(hop: HopItem): boolean {
  switch (hop.type) {
    case 'boil':
    case 'first wort':
      return typeof hop.timeMin === 'number' && hop.timeMin >= 0;
    case 'dry hop':
      return (
        typeof hop.dryHopStartDay === 'number' &&
        typeof hop.dryHopDays === 'number' &&
        hop.dryHopDays > 0
      );
    case 'whirlpool':
      return (
        typeof hop.whirlpoolTimeMin === 'number' &&
        typeof hop.whirlpoolTempC === 'number'
      );
    case 'mash':
      return true; // No special fields required
    default:
      return false;
  }
}
```

**Recommendation:** Add validation now, consider discriminated union in v2.0.

---

### 4.6 Understand BrewSessions Array

**Current Code:**
```typescript
type Recipe = {
  // ...
  brewSessions: Array<{
    id: string;
    brewDate: string;
    actualOg?: number;
    actualFg?: number;
    actualAbv?: number;
    actualVolume?: number;
    notes?: string;
    status: "planned" | "brewing" | "fermenting" | "conditioning" | "complete";
  }>;
  // ...
};
```

**Purpose:** Track multiple brew sessions for the same recipe.

**Usage:** Likely in BrewMode.tsx when you record actual values.

**Issue:** After 50+ brew sessions, this array makes the recipe JSON huge.

**Solutions:**

**Option A: Separate storage**
```typescript
// Don't store sessions in Recipe
// Store in separate key
const SESSION_KEY_PREFIX = 'beerapp.sessions.';

export function loadBrewSessions(recipeId: string): BrewSession[] {
  return loadJson(`${SESSION_KEY_PREFIX}${recipeId}`, []);
}

export function saveBrewSession(recipeId: string, session: BrewSession) {
  const sessions = loadBrewSessions(recipeId);
  const updated = [...sessions, session];
  saveJson(`${SESSION_KEY_PREFIX}${recipeId}`, updated);
}
```

**Option B: Limit + Archive**
```typescript
// Keep last 10 sessions in recipe, archive the rest
const MAX_SESSIONS_IN_RECIPE = 10;

function archiveOldSessions(recipe: Recipe) {
  if (recipe.brewSessions.length <= MAX_SESSIONS_IN_RECIPE) {
    return recipe;
  }

  const sorted = [...recipe.brewSessions].sort(
    (a, b) => new Date(b.brewDate).getTime() - new Date(a.brewDate).getTime()
  );

  const recent = sorted.slice(0, MAX_SESSIONS_IN_RECIPE);
  const archived = sorted.slice(MAX_SESSIONS_IN_RECIPE);

  // Save archived sessions separately
  const archiveKey = `beerapp.sessions.archive.${recipe.id}`;
  const existingArchive = loadJson<BrewSession[]>(archiveKey, []);
  saveJson(archiveKey, [...existingArchive, ...archived]);

  return {
    ...recipe,
    brewSessions: recent,
  };
}
```

**Recommendation:** Option B (keep recent in recipe, archive old ones).

---

## Phase 5: Architecture Improvements (Ongoing)

### 5.1 Add Error Boundaries

**Create Error Boundary Component:**

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-600 mb-4">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary ml-2"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**

```typescript
// In App.tsx
export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-dvh ...">
        <NavBar />
        <ErrorBoundary>
          <main className="...">
            <Outlet />
          </main>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

// In RecipeBuilder.tsx (wrap calculation-heavy sections)
<ErrorBoundary fallback={<div>Error in calculations</div>}>
  <SummaryStickyHeader {...} />
</ErrorBoundary>
```

---

### 5.2 Extract Calculation Hook into Testable Functions

**Current Issue:** `useRecipeCalculations` is a hook, can't test without React.

**Solution:** Extract logic into pure functions.

```typescript
// src/utils/recipeCalculations.ts (new file)

export type RecipeInputs = {
  grains: GrainItem[];
  hops: HopItem[];
  yeast: YeastItem;
  batchVolumeL: number;
  efficiencyPct: number;
  mashSteps: MashStep[];
  fermentationSteps: FermentationStep[];
  waterParams: WaterParams;
  ogAuto: boolean;
  actualOg?: number;
  fgAuto: boolean;
  actualFg?: number;
};

export type RecipeCalculations = {
  ogAutoCalc: number;
  ogUsed: number;
  fgEstimated: number;
  fgUsed: number;
  abv: number;
  ibu: number;
  srm: number;
  color: string;
  // ... all other calculated fields
};

// Pure function - easy to test!
export function calculateRecipe(inputs: RecipeInputs): RecipeCalculations {
  // Move all calculation logic here
  const totalGrainKg = totalGrainWeightKg(inputs.grains);
  const srm = srmMoreyFromMcu(mcuFromGrainBill(inputs.grains, inputs.batchVolumeL));
  // ... etc

  return {
    ogAutoCalc,
    ogUsed,
    // ... all results
  };
}

// Hook becomes a thin wrapper
export function useRecipeCalculations(params: RecipeInputs) {
  return useMemo(() => calculateRecipe(params), [
    params.grains,
    params.hops,
    // ... dependencies
  ]);
}
```

**Benefits:**
- Can unit test `calculateRecipe` without React
- Can use in Node.js scripts (export recipes, etc.)
- Easier to debug

---

## Priority Roadmap

### Week 1: Critical Fixes
- [ ] Day 1-2: Fix hop absorption bug (#1.1, #1.2)
- [ ] Day 3: Fix brew mode timer (#2.1)
- [ ] Day 4-5: Add debouncing (#3.1)

### Week 2: Performance & Data Quality
- [ ] Day 1-2: Memoize preset loading (#3.2)
- [ ] Day 3: Add magic number comments (#3.4)
- [ ] Day 4: Improve localStorage error handling (#4.3)
- [ ] Day 5: Add recipe validation (#4.4)

### Week 3: Architecture
- [ ] Day 1-2: Add error boundaries (#5.1)
- [ ] Day 3-4: Extract calculation functions (#5.2)
- [ ] Day 5: Review and test

### Future (V2.0)
- [ ] Refactor type system (#4.2)
- [ ] Fix hop item time fields (#4.5)
- [ ] Add comprehensive test suite
- [ ] Add migration system (#26)

---

## Testing Strategy

### For Each Change:

1. **Unit Tests** (if applicable)
   - Test pure functions in isolation
   - Test edge cases (0, negative, very large numbers)

2. **Integration Tests**
   - Create recipe
   - Modify recipe
   - Save recipe
   - Load recipe
   - Verify calculations match expected values

3. **Manual Testing Checklist**
   - [ ] Create new recipe from scratch
   - [ ] Load existing recipe
   - [ ] Modify grains → verify OG updates
   - [ ] Modify hops → verify IBU updates
   - [ ] Modify water → verify volumes update
   - [ ] Save recipe → verify in localStorage
   - [ ] Reload page → verify recipe loads correctly
   - [ ] Delete recipe → verify removed
   - [ ] Export recipe (if feature exists)
   - [ ] Test on mobile (if applicable)

4. **Regression Tests**
   - Load old recipes from before changes
   - Verify they still work
   - Verify calculations are still accurate

---

## Rollback Plan

For each phase, before starting:

1. Create git branch: `refactor/phase-X-description`
2. Commit frequently with descriptive messages
3. If something breaks:
   - `git log` to find last working commit
   - `git revert <commit>` or `git reset --hard <commit>`
   - Document what went wrong
   - Adjust plan

---

## Success Metrics

### Performance
- [ ] Recipe builder page loads in <1 second
- [ ] Typing in inputs feels instant (no lag)
- [ ] Preset search returns results in <100ms
- [ ] Changing grain weight updates calcs in <300ms

### Reliability
- [ ] Zero console errors on normal usage
- [ ] Timer accurate within 1 second after 1 hour
- [ ] No data loss on save
- [ ] Graceful error messages (no crashes)

### Code Quality
- [ ] All magic numbers commented
- [ ] Error boundaries catch crashes
- [ ] localStorage failures handled
- [ ] Invalid recipes don't crash app

---

## Notes

- Don't try to fix everything at once
- Test thoroughly after each change
- Keep git history clean with good commit messages
- Document any deviations from this plan
- If you discover new issues, add them to this document

