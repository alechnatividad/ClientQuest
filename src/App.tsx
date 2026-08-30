import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import RequireAuth from "./components/app/RequireAuth";
import AppShell from "./components/app/AppShell";
import { WorkspaceProvider } from "./lib/workspace";
import { AuthProvider } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import DashboardPage from "./pages/owner/DashboardPage";
import ProjectsPage from "./pages/owner/ProjectsPage";
import ProjectWorkspacePage from "./pages/owner/ProjectWorkspacePage";
import ClientsPage from "./pages/clients/ClientsPage";
import SettingsPage from "./pages/owner/SettingsPage";

/**
 * ClientQuest route map.
 *
 *   /                        marketing site (untouched)
 *   /login · /auth/callback  passwordless auth flow (untouched)
 *   /p/:token                passwordless client portal (untouched)
 *   /app                     owner app — RequireAuth → WorkspaceProvider →
 *                            AppShell. The WorkspaceProvider centralizes the
 *                            Phase 2B workspace bootstrap for every page.
 */

function Home() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate("/app")} />;
}

/** Layout nested under RequireAuth: boots the workspace, then the shell. */
function WorkspaceShell() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/p/:token" element={<ClientPortalPage />} />

          <Route path="/app" element={<RequireAuth />}>
            <Route element={<WorkspaceShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
