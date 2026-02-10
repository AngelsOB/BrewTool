# frontend-design Audit:

**NOTE: Light mode theme fixes have been implemented via CSS overrides in index.css**
- Most hardcoded white/black opacity classes now use theme-aware colors via `!important` overrides
- Buttons use theme-aware backgrounds and borders

**NOTE: Vite path aliases are configured**
- Enables clean imports: `@components/*`, `@pages/*`, `@calculators/*`, `@utils/*`

### Remaining Items

- [x] **27. Section color-coding** – `border-t-4` color is now consistent across all legacy recipe components (GrainBill.tsx uses blue-500, HopSchedule.tsx uses green-500, YeastSection.tsx uses amber-500, OtherIngredients.tsx uses orange-500)
- [x] **28. `tailwind.config.js`** – The unused shadow-inset token has been removed. The shadow-soft token remains but has CSS overrides in index.css that make it theme-aware.


# BeerApp Fullstack-developer Audit - Todo List

## MEDIUM SEVERITY

- [x] **No Prettier Configuration**
  - Prettier (^3.5.3) and prettier-plugin-tailwindcss (^0.6.11) added to devDependencies with format scripts.

## LOW SEVERITY

- [ ] **`package.json` - react-router-dom Vulnerabilities (SSR-Only)**
  - `react-router-dom@^7.8.0` has reported CVEs (CSRF, XSS via redirects, SSR XSS), but these affect **server-side rendering** features. This app is a pure client-side SPA using `createBrowserRouter` — no SSR code exists. Upgrade when convenient, but not a real attack vector here.

- [ ] **`index.html` - No Content-Security-Policy**
  - Missing CSP headers. However, this app deploys to GitHub Pages, which doesn't allow custom HTTP headers. CSP meta tags have limited effectiveness there. Actionable only if deployment target changes.

- [ ] **`vite.config.ts` - Missing Production Sourcemap Config**
  - No `build.sourcemap` setting. Vite defaults to no sourcemaps in production, which is fine. Explicitly setting `sourcemap: false` is just defensive documentation.

- [ ] **`index.html` - Missing SEO/PWA Metadata**
  - No `<meta name="description">`, no Open Graph tags, no `manifest.json` link, no `apple-touch-icon`, default Vite favicon (`vite.svg`) still in use. Meaningful if the app is shared publicly.

- [ ] **`src/modules/beta-builder/domain/services/*` - Some Undocumented Magic Numbers**
  - Most constants in calculation services have comments citing research (e.g., Maye et al. 2016 in IBU service). However, some values in `StarterCalculationService` (e.g., `0.007` viability loss/day, `1.4` billion/gram) could benefit from named constants.

- [x] **`src/modules/beta-builder/domain/repositories/EquipmentRepository.ts` - Unnecessary Async**
  - Added comment documenting that async signatures are intentional for future API migration.

- [ ] **`src/modules/beta-builder/domain/models/Recipe.ts` - Inconsistent Null vs Undefined**
  - Some optional fields use `?` (e.g., `fermentability?: number`) while others use `| null` (e.g., `estimatedMashPh: number | null`). Pick one convention for "no value."

- [x] **`package.json` - Missing `engines` Field**
  - Added `"engines": { "node": ">=22.0.0" }` to package.json.

- [ ] **`src/modules/beta-builder/domain/services/MashPhCalculationService.ts` - Bisection Solver Fallback**
  - Lines 314-348: Bisection solver has proper convergence checking (`BISECT_TOL = 0.001`, `BISECT_MAX_ITER = 50`) and returns early on convergence. The fallback `return (lo + hi) / 2` after max iterations is mathematically sound but could optionally log a warning.

- [x] **Accessibility Warnings from eslint-plugin-jsx-a11y**
  - **Status:** Reduced from 73 warnings to 11 warnings
  - **Remaining Issues (11 warnings):**
    - All remaining warnings are `no-autofocus` (intentional for modal UX)
  - **Fixes Applied:**
    - `label-has-associated-control` warnings fixed by configuring ESLint to recognize custom components (InputWithSuffix, DualUnitInput, InlineEditableNumber, AutoWidthUnitSelect, NotesTextarea, SearchSelect)
    - Modal backdrop click handlers now have proper eslint-disable comments since keyboard handling is done via document listeners
    - VersionHistoryModal now has proper keyboard handlers and ARIA roles for interactive elements
