import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          lazy: async () => ({
            Component: (await import("./pages/Home.tsx")).default,
          }),
        },
        {
          path: "calculators",
          lazy: async () => ({
            Component: (await import("./pages/Calculators.tsx")).default,
          }),
        },
        {
          path: "recipes",
          lazy: async () => ({
            Component: (await import("./pages/RecipeBuilder.tsx")).default,
          }),
        },
        {
          path: "beta-builder",
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/RecipeListPage.tsx"
                  )
                ).default,
              }),
            },
            {
              path: "recipes",
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/RecipeListPage.tsx"
                  )
                ).default,
              }),
            },
            {
              path: "new",
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/BetaBuilderPage.tsx"
                  )
                ).default,
              }),
            },
            {
              path: "sessions/:sessionId",
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/BrewSessionPage.tsx"
                  )
                ).default,
              }),
            },
            {
              path: ":id/versions/:versionNumber",
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/BetaBuilderPage.tsx"
                  )
                ).default,
              }),
            },
            {
              path: ":id",
              lazy: async () => ({
                Component: (
                  await import(
                    "./modules/beta-builder/presentation/components/BetaBuilderPage.tsx"
                  )
                ).default,
              }),
            },
          ],
        },
        {
          path: "brew/:id",
          lazy: async () => ({
            Component: (await import("./pages/BrewMode.tsx")).default,
          }),
        },
        {
          path: "test",
          lazy: async () => ({
            Component: (await import("./components/DualUnitInputTest.tsx"))
              .default,
          }),
        },
      ],
    },
  ],
  { basename }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="p-6 text-white/70">Loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>
);
