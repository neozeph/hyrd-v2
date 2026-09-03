import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "./use-auth";

function LoadingScreen() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-hyrd-page px-6 text-center text-sm text-hyrd-muted"
    >
      Restoring your HYRD session...
    </main>
  );
}

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const from = location.state?.from?.pathname ?? "/dashboard";

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate replace to={from} />;
  }

  return <Outlet />;
}
