import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ToastViewport from "./components/ui/ToastViewport";
import DiscoverPage from "./pages/app/DiscoverPage";
import CreatePage from "./pages/app/CreatePage";
import ChatsPage from "./pages/app/ChatsPage";
import ProfilePage from "./pages/app/ProfilePage";
import SettingsPage from "./pages/app/SettingsPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function AppBootstrap({ children }) {
  const { initAuth, stopAuthListener } = useAuthStore();

  useEffect(() => {
    initAuth();
    return () => stopAuthListener();
  }, [initAuth, stopAuthListener]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBootstrap>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/discover" replace />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="discover/:id" element={<DiscoverPage />} />
            <Route path="create" element={<CreatePage />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastViewport />
      </AppBootstrap>
    </BrowserRouter>
  );
}
