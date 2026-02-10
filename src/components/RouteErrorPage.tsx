import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist.";
    } else if (error.status === 500) {
      title = "Server error";
      message = "Something went wrong on our end.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = import.meta.env.DEV ? error.message : message;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[rgb(var(--bg))] px-4 text-center text-[rgb(var(--text))]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
        <svg
          className="h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--fg-strong)]">{title}</h1>
        <p className="mt-2 max-w-md text-[var(--fg-muted)]">{message}</p>
      </div>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="max-w-full overflow-auto rounded-lg bg-red-500/10 p-4 text-left text-sm text-red-400">
          {error.stack}
        </pre>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          Go back
        </button>
        <button
          onClick={() => navigate("/")}
          className="btn-neon"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
