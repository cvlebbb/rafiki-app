// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // The initAuth function already runs in AppBootstrap
    // Just wait for it to detect the session from URL
    if (!loading) {
      if (user) {
        console.log("Auth successful, redirecting to discover");
        navigate("/app/discover", { replace: true });
      } else {
        console.log("No user found, redirecting to login");
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--deep-black)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--bold-green)] mx-auto"></div>
        <p className="mt-4 text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
