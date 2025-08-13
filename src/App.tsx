import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";

export default function App() {
  return (
    <div className="min-h-dvh text-[rgb(var(--text))] bg-[rgb(var(--bg))] bg-dashboard">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
