import { Navigate, Route, Routes } from "react-router";

import { GuestRoute, ProtectedRoute } from "./auth/auth-routes";
import { ScrollToTop } from "./components/scroll-to-top";
import { ApplicationsPage } from "./pages/applications-page";
import { DashboardPage } from "./pages/dashboard-page";
import { LandingPage } from "./pages/landing-page";
import { LegalPage } from "./pages/legal-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";
import { SettingsPage } from "./pages/settings-page";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
