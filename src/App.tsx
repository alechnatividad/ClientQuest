import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import LandingPage from "./components/LandingPage";
import RequireAuth from "./components/app/RequireAuth";
import AppShell from "./components/app/AppShell";
import LoginPage from "./pages/LoginPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import DashboardPage from "./pages/owner/DashboardPage";
import ProjectsPage from "./pages/owner/ProjectsPage";
import ProjectWorkspacePage from "./pages/owner/ProjectWorkspacePage";
import ClientsPage from "./pages/clients/ClientsPage";
import SettingsPage from "./pages/owner/SettingsPage";

/** Marketing home — "enter portal" CTAs now lead to the passwordless demo portal. */
function Home() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate("/p/demo")} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/p/:token" element={<ClientPortalPage />} />

          {/* owner app (protected) */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* anything else goes home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
