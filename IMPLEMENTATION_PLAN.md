# frontend-design Audit:
### Critical: Light Mode Is Broken

**NOTE: Light mode theme fixes have been implemented via CSS overrides in index.css**
- Most hardcoded white/black opacity classes now use theme-aware colors via `!important` overrides
- Buttons use theme-aware backgrounds and borders

**NOTE: Vite path aliases are configured**
- Enables clean imports: `@components/*`, `@pages/*`, `@calculators/*`, `@utils/*`

The app was clearly built dark-mode-first, and **light mode is largely non-functional**. Nearly every component uses hardcoded dark-mode assumptions:

- [ ] **1. `index.css`** – `.bg-dashboard` gradient
- [ ] **2. `index.css`** – `.card-glass` shadow
- [ ] **3. `index.css`** – `.btn-neon` and `.btn-outline`
- [ ] **5. Home.tsx / Calculators.tsx / CalculatorCard.tsx**
- [ ] **6. SearchSelect.tsx**
- [ ] **7. AbvCalculator / IbuCalculator / WaterSaltsCalc** – Labels use `text-neutral-700`, barely visible in dark mode

---

### High: Inconsistent Design System

- [x] **8. No shared Input component** – Inputs are styled ad-hoc with ~6 different class combinations across files
  - **Completed:** Added Input.tsx (default, flush, filled variants), Select.tsx (matching variants with custom chevron), Textarea.tsx (matching variants). Updated CustomFermentableModal, CustomHopModal, CustomYeastModal, MashStepModal to use shared components.
- [x] **9. No shared Button component** – Buttons use completely different styling per file (green-600, blue-600, neon, outline, tonal — all inline)
  - **Completed:** Added Button.tsx (neon, outline, tonal, danger, ghost, link variants) and IconButton.tsx (with required aria-label)
- [x] **10. No shared Modal component** – Modals are copy-pasted with inconsistent backdrops (`bg-black bg-opacity-50` vs `backdrop-blur-sm`)
  - **Completed:** Migrated 6 modals to use ModalOverlay: CustomFermentableModal, CustomHopModal, CustomYeastModal, CustomEquipmentModal, EquipmentProfileModal, VersionHistoryModal. All now have consistent backdrop, focus trapping, ESC key support, and ARIA attributes.
- [ ] **11. BetaBuilderPage.tsx** – Mixes Tailwind color utilities (`bg-white`, `bg-gray-800`) with CSS variable theme system (`rgb(var(--card))`) in the same file
- [ ] **12. Focus ring inconsistency** – Some inputs use `ring-emerald-500`, others `ring-blue-500`, others have no focus indicator

---

### High: Code Duplication

- [ ] **13. BetaBuilderPage.tsx** – Sticky top header and sticky bottom header are identical ~70-line blocks; extract a `StickyStatsBar` component
- [ ] **14. BetaBuilderPage.tsx** – Calculated Values shown multiple times (inline cards, sticky top, sticky bottom, full bottom section); remove duplicate bottom section
- [ ] **15. FermentableSection / HopSection** – Nearly identical modal structure; extract a shared `PresetPickerModal` shell

---

### Medium: Navigation & Layout

- [x] **16. NavBar.tsx** – No navigation links; users can't navigate between Calculators / Recipes / Beta Builder without knowing URLs
- [x] **17. NavBar.tsx** – Has `top-0` but missing `sticky`; doesn't actually stick on scroll
  - **Completed:** Added navigation links to Calculators, Recipes, Recipe Builder. Added sticky positioning. Mobile hamburger menu with accessibility (aria-expanded, keyboard support, focus management).
- [ ] **18. Home.tsx** – Bottom grid has only one card in a three-column layout; looks incomplete
- [ ] **19. App.tsx + Pages** – Double horizontal padding (`px-4 sm:px-6 lg:px-8`) applied at both app and page level

---

### Medium: Accessibility & UX

- [ ] **20. IbuCalculator.tsx** – Hop rows have `aria-label` but no visible labels for Grams / Alpha % / Minutes
- [ ] **21. IbuCalculator.tsx** – No remove button for hop additions
- [ ] **22. DualUnitInput.tsx** – Dead code: identical ternary branches for `readOnly` button classes
- [ ] **23. DualUnitInput.tsx** – No explicit background color on input; inherits browser default
- [ ] **24. ThemeToggle.tsx** – Hover state `hover:bg-white/10` invisible on light-mode background
- [x] **25. RecipeListPage.tsx** – Delete modal text uses `text-black`; unreadable in dark mode
  - **Completed:** Fixed to use theme variable
- [ ] **26. RecipeListPage.tsx** – Uses `document.getElementById` (React anti-pattern); should use `useRef`
- [x] **27. RecipeListPage.tsx** – Uses native `alert()` for import failures; should use in-app toast
  - **Completed:** Now uses toast notifications

---

### Low: Polish

- [ ] **28. FermentableSection / HopSection** – 12-column grids don’t collapse well on mobile
- [ ] **29. HopSection.tsx** – Tooltip portal doesn’t handle viewport edge collision
- [ ] **30. WaterSaltsCalc.tsx** – Typo: `text-white-400` → `text-white/40`
- [ ] **31. RecipeCard** – Empty flex container in footer renders unused whitespace
- [ ] **32. Section color-coding** – `border-t-4` color used inconsistently (Fermentables / Hops only)
- [ ] **33. `tailwind.config.js`** – Custom shadow tokens use hardcoded dark-mode values that persist in light mode

---

### Highest-Impact TODOs

- [ ] Fix theme system so light mode actually works (items 1–7)
- [x] Create shared primitives: `Input`, `Button`, `Modal` (items 8–10) — All complete
- [ ] Add NavBar navigation links (item 16)
- [ ] Extract duplicated sticky stats bar (item 13)


# BeerApp Fullstack-developer Audit - Todo List
## CRITICAL (Fix Immediately)

### Recently Completed
- Error boundaries and test route gating
- Toast notification system (toastStore.ts + Toaster.tsx)
- RecipeRepository corrupted data detection with user recovery option
- Replaced all browser alert() calls with non-blocking toast notifications

### Remaining HIGH SEVERITY

- [x] **No Testing Framework Installed**
  - **Completed:** Vitest installed with 138 tests covering:
    - IBU calculation (Tinseth model with boil gravity, bigness factor, and boil duration corrections)
    - ABV calculation (OG/FG conversion to standard gravity)
    - Mash pH calculation (proton deficit model with acid/base adjustments)
    - Starter calculation (White and Braukaiser models with viability loss)
    - Recipe calculation orchestrator (aggregates all domain calculations)

- [x] **`src/modules/beta-builder/domain/repositories/RecipeRepository.ts` - Corrupted Data Returns Empty**
  - **Completed:** Fixed with loadAllSafe() that returns a Result type and surfaces errors to users via toast

- [x] **`src/modules/beta-builder/domain/models/Equipment.ts` - Inconsistent Unit Convention**
  - **Completed:** Renamed hopAbsorptionL_g to hopAbsorptionL_kg, fixed preset values from incorrect 5 L/kg (0.005 L/g) to industry-standard 0.7 L/kg, removed manual conversions from EquipmentSection.tsx and CustomEquipmentModal.tsx

- [ ] **`.github/workflows/deploy.yml` - Missing Quality Gates**
  - No `npm run lint` or `npm audit` step before build. TypeScript type-checking runs as part of the build (`tsc -b && vite build`), but linting errors and known dependency vulnerabilities won't block deployment.

## MEDIUM SEVERITY

- [ ] **`eslint.config.js` - Missing Critical Rules**
  - Only uses recommended presets. No `no-console` rule (29+ console statements ship to production). No `eqeqeq` enforcement. No `eslint-plugin-jsx-a11y` for accessibility linting. No import ordering rules.

- [ ] **No Prettier Configuration**
  - No `.prettierrc` or equivalent found. No Prettier in devDependencies. Add Prettier for consistent formatting.

- [ ] **`src/modules/beta-builder/presentation/components/BrewSessionPage.tsx` - Monolithic Component**
  - 911 lines: Handles session management, editing, modals, and calculations. Break into `SessionHeader`, `ActualsEditor`, `BrewDayRecipeModal`, `SessionMetrics` sub-components.

- [ ] **`src/modules/beta-builder/presentation/components/WaterSection.tsx` - Monolithic Component**
  - 918 lines: Handles water chemistry, salt additions, pH adjustments, and modals. Extract `WaterProfile`, `SaltAdditions`, `PhAdjustments`, `WaterIngredientModal`.

- [ ] **`src/modules/beta-builder/presentation/components/YeastSection.tsx` - Monolithic Component**
  - 837 lines: Handles yeast selection, starter calculations, and lab favicons. Split into `YeastSelector`, `StarterCalculator`.

- [x] **`src/modules/beta-builder/presentation/components/ModalOverlay.tsx` - Accessibility Gaps**
  - Missing `role="dialog"` and `aria-modal="true"` attributes. No focus trap — keyboard users can tab to background content. Has ESC key handling and scroll lock, but no focus management.
  - **Completed:** Added role='dialog', aria-modal='true', aria-labelledby support, Tab/Shift+Tab focus trapping, and focus restoration

- [ ] **`src/modules/beta-builder/presentation/components/BetaBuilderPage.tsx` - Missing Accessibility**
  - Icon-only buttons (e.g., `×` delete buttons in FermentableSection, HopSection, YeastSection) lack `aria-label` attributes. No skip-to-content navigation link in App.tsx or index.html.

- [ ] **`src/modules/beta-builder/presentation/stores/brewSessionStore.ts` - Business Logic in Presentation**
  - Lines 204-261: `calculateSessionMetrics` contains ABV, attenuation, mash efficiency, and brewhouse efficiency calculations. These are domain concerns that should live in a domain service, not a Zustand store.

- [ ] **`src/modules/beta-builder/presentation/stores/recipeStore.ts` - Hop Flavor Enrichment in Presentation**
  - Lines 16-21 and 237-271: `HOP_FLAVOR_MAP` lookup and flavor enrichment during JSON import should live in the domain layer (e.g., `BeerXmlImportService` or a `HopEnrichmentService`).

- [ ] **`src/utils/storage.ts` - Silent Error Swallowing**
  - Lines 6-17: `loadJson` catches all errors and returns `defaultValue`. Doesn't distinguish "key not found" (normal) from "JSON parse failed" (data corruption) or "SecurityError" (private browsing). Consider logging or differentiating error types.

- [ ] **`src/hooks/useRecipeStore.ts` - Weak UUID Fallback (Legacy Store)**
  - Lines 46-49 and 310-314: Falls back to `Date.now()` when `crypto.randomUUID()` is unavailable. Can produce collisions on rapid recipe creation. Use `crypto.getRandomValues` fallback or drop legacy browser support.

- [ ] **`src/calculators/ibu.ts` - Missing Input Validation**
  - `ibuSingleAddition()` has no guards: negative `weightGrams` → negative IBUs, `postBoilVolumeLiters = 0` → Infinity/NaN, `alphaAcidPercent > 100` → inflated IBUs. Add boundary checks or document expected input ranges.

- [ ] **`src/types/store.local.ts` - Uses `any[]` Types (Legacy Store)**
  - Lines 60-101: All ingredient storage accessors (`fermentables`, `hops`, `yeasts`) use `any[]` instead of domain types like `Fermentable[]`, `Hop[]`, `Yeast[]`. Bypasses TypeScript safety.

- [x] **`src/modules/beta-builder/presentation/components/FermentableSection.tsx` - Inconsistent Modal Pattern**
  - Implements its own modal inline with `<div className="fixed inset-0...">` instead of reusing the `ModalOverlay` component or `createPortal` like HopSection and other sections do. Standardize.
  - **Completed:** CustomFermentableModal now uses ModalOverlay consistently.

## LOW SEVERITY

- [ ] **`src/calculators/abv.ts` - Dead Code (`abvMorey`)**
  - The `abvMorey` function has a double-application bug (`fg/0.794` applied twice), but nothing in the app imports or calls it. All actual ABV calculations use `(og - fg) * 131.25` correctly. Delete or fix the dead function.

- [ ] **`package.json` - react-router-dom Vulnerabilities (SSR-Only)**
  - `react-router-dom@^7.8.0` has reported CVEs (CSRF, XSS via redirects, SSR XSS), but these affect **server-side rendering** features. This app is a pure client-side SPA using `createBrowserRouter` — no SSR code exists. Upgrade when convenient, but not a real attack vector here.

- [ ] **`src/App.tsx` - Redundant useEffect**
  - Line 10-13: `useEffect(() => { setTheme(theme); }, [])` is mount-only by design, but `useThemeStore` already handles theme application via `onRehydrateStorage`. This effect is likely unnecessary. Either remove it or add a comment explaining why it's needed.

- [ ] **`index.html` - No Content-Security-Policy**
  - Missing CSP headers. However, this app deploys to GitHub Pages, which doesn't allow custom HTTP headers. CSP meta tags have limited effectiveness there. Actionable only if deployment target changes.

- [ ] **`vite.config.ts` - Missing Production Sourcemap Config**
  - No `build.sourcemap` setting. Vite defaults to no sourcemaps in production, which is fine. Explicitly setting `sourcemap: false` is just defensive documentation.

- [ ] **`index.html` - Missing SEO/PWA Metadata**
  - No `<meta name="description">`, no Open Graph tags, no `manifest.json` link, no `apple-touch-icon`, default Vite favicon (`vite.svg`) still in use. Meaningful if the app is shared publicly.

- [ ] **`src/utils/presets.ts` - Dead Code**
  - Lines 71-74: `GRAIN_PRESETS` exported as an empty array with a comment explaining data comes from `GENERATED_GRAINS`. The export and the loop over it in `getGrainPresets()` are no-ops. Clean up.

- [ ] **`src/modules/beta-builder/domain/services/*` - Some Undocumented Magic Numbers**
  - Most constants in calculation services have comments citing research (e.g., Maye et al. 2016 in IBU service). However, some values in `StarterCalculationService` (e.g., `0.007` viability loss/day, `1.4` billion/gram) could benefit from named constants.

- [ ] **`src/modules/beta-builder/domain/repositories/EquipmentRepository.ts` - Unnecessary Async**
  - Lines 19-81: All methods are `async` returning Promises, but only do synchronous localStorage operations. Remove `async` or add a comment documenting this is intentional for future API migration.

- [ ] **`src/modules/beta-builder/domain/models/Recipe.ts` - Inconsistent Null vs Undefined**
  - Some optional fields use `?` (e.g., `fermentability?: number`) while others use `| null` (e.g., `estimatedMashPh: number | null`). Pick one convention for "no value."

- [ ] **`package.json` - Missing `engines` Field**
  - No Node version specification. CI uses Node 22, but contributors aren't constrained. Add `"engines": { "node": ">=22.0.0" }`.

- [ ] **Console Statements in Production Code**
  - 29 `console.log/warn/error` calls across 7 files, mostly `console.error` in repository catch blocks. Replace with a logging utility or gate behind `import.meta.env.DEV`.

- [ ] **`src/modules/beta-builder/domain/services/MashPhCalculationService.ts` - Bisection Solver Fallback**
  - Lines 314-348: Bisection solver has proper convergence checking (`BISECT_TOL = 0.001`, `BISECT_MAX_ITER = 50`) and returns early on convergence. The fallback `return (lo + hi) / 2` after max iterations is mathematically sound but could optionally log a warning.
