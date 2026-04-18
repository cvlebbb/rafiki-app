import { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";
import { resolveAvatarUrl, signInWithGoogle, signOut, upsertProfileFromUser } from "../lib/auth";

export default function SupabaseAuth({ onUserChange }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const activeUser = data.session?.user || null;
        if (mounted) {
          setUser(activeUser);
          onUserChange?.(activeUser);
        }

        if (activeUser) {
          await upsertProfileFromUser(activeUser);
        }
      } catch (error) {
        if (mounted) {
          setErrorMsg(error.message || "Could not check session.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const activeUser = session?.user || null;
        setUser(activeUser);
        onUserChange?.(activeUser);

        if (activeUser) {
          await upsertProfileFromUser(activeUser);
        }
      } catch (error) {
        setErrorMsg(error.message || "Auth state sync failed.");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onUserChange]);

  async function handleSignInClick() {
    try {
      setErrorMsg("");
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      setErrorMsg(error.message || "Could not start Google sign-in.");
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOutClick() {
    try {
      setErrorMsg("");
      setSigningOut(true);
      await signOut();
      setUser(null);
      onUserChange?.(null);
    } catch (error) {
      setErrorMsg(error.message || "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <div className="glass-card p-4 text-sm">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-rafiki-ink">Jump In</h2>
        {!hasSupabaseConfig ? (
          <p className="mt-1 text-sm text-rose-600">Set Supabase env vars to enable Google sign-in.</p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Sign in with Google to unlock hangouts and real-time chat.</p>
        )}
        <button
          className="cta-btn mt-4 w-full disabled:opacity-60"
          onClick={handleSignInClick}
          disabled={!hasSupabaseConfig || signingIn}
        >
          {signingIn ? "Connecting..." : "Continue with Google"}
        </button>
        {errorMsg && <p className="mt-3 text-xs text-rose-600">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="glass-card flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <img
          src={resolveAvatarUrl(user) || "https://placehold.co/64x64?text=R"}
          alt="avatar"
          className="h-10 w-10 rounded-full border-2 border-rafiki-purple/50 object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-rafiki-ink">{user.user_metadata?.full_name || user.email}</p>
          <p className="text-xs text-slate-500">Ready for your next hangout</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="secondary-btn" onClick={handleSignOutClick} disabled={signingOut}>
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
        <button type="button" className="cta-btn" onClick={handleSignOutClick} disabled={signingOut}>
          Log out
        </button>
      </div>
      {errorMsg && <p className="ml-3 text-xs text-rose-600">{errorMsg}</p>}
    </div>
  );
}