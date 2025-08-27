import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

import Home from "./pages/Home.tsx";
import Calculators from "./pages/Calculators.tsx";
import RecipeBuilder from "./pages/RecipeBuilder.tsx";
import BrewMode from "./pages/BrewMode.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: "calculators", element: <Calculators /> },
        { path: "recipes", element: <RecipeBuilder /> },
        { path: "brew/:id", element: <BrewMode /> },
      ],
    },
  ],
  { basename }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
