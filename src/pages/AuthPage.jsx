import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useToastStore } from "../stores/useToastStore";

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const { pushToast } = useToastStore();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});

  const redirectTarget = useMemo(() => location.state?.from || "/app/discover", [location.state]);

  useEffect(() => {
    if (user) {
      navigate("/app/discover", { replace: true });
    }
  }, [navigate, user]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onGoogle() {
    try {
      await signInWithGoogle();
    } catch (error) {
      pushToast(error.message || "Google sign-in failed.", "⚠");
    }
  }

  async function onSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Password is required.";

    if (isSignup) {
      if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
      if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) {
        nextErrors.username = "Username must be alphanumeric (underscores allowed).";
      }
      if (form.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (isSignup) {
        await signUpWithEmail(form.email.trim(), form.password, form.username.trim(), form.fullName.trim());
        pushToast("Account created. Check your email verification if required.", "📩");
      } else {
        await signInWithEmail(form.email.trim(), form.password);
        pushToast("Welcome back.", "🟢");
      }

      navigate(redirectTarget, { replace: true });
    } catch (error) {
      const message = error.message || "Authentication failed.";
      if (/username/i.test(message)) {
        setErrors((prev) => ({ ...prev, username: message }));
      } else {
        pushToast(message, "⚠");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--deep-black)] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[88vh] max-w-6xl overflow-hidden rounded-3xl border border-[#1c1c1c] bg-[#0f0f0f] md:grid-cols-2">
        <section className="landing-grid-bg relative border-b border-[#1b1b1b] bg-[rgba(0,200,81,0.08)] p-8 md:border-b-0 md:border-r">
          <h1 className="font-display text-3xl tracking-[0.2em]">RAFI<span className="text-[var(--magenta)]">KI</span></h1>
          <p className="mt-6 max-w-md text-[#b4d0bb]">"Rafiki made my plans feel alive again. Zero stale group chats."</p>
          <ul className="mt-8 space-y-3 text-sm text-[#c2dfc9]">
            <li>• Build hangouts in under 60 seconds</li>
            <li>• Join active crews with real-time chat</li>
            <li>• Track urgency with countdown energy</li>
          </ul>
        </section>

        <section className="p-8">
          <h2 className="font-title text-3xl">{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="mt-2 text-sm text-[#9a9a9a]">{isSignup ? "Sign up to unlock the Rafiki grid." : "Log in to continue."}</p>

          <button type="button" className="google-btn mt-6 w-full" onClick={onGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.4l2.7-2.6C17 2.4 14.7 1.5 12 1.5 6.8 1.5 2.6 5.8 2.6 11s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.1-1.1H12z"/>
            </svg>
            Continue with Google
          </button>

          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            {isSignup && (
              <>
                <div>
                  <input className="input-shell" placeholder="Username" value={form.username} onChange={(e) => setField("username", e.target.value)} />
                  {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
                </div>
                <div>
                  <input className="input-shell" placeholder="Full name" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
                  {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
                </div>
              </>
            )}

            <div>
              <input className="input-shell" placeholder="Email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <input className="input-shell" placeholder="Password" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </button>
          </form>

          <p className="mt-4 text-sm text-[#989898]">
            {isSignup ? "Already have an account?" : "New here?"} {" "}
            <Link className="text-[var(--bold-green)]" to={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Login" : "Sign up"}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}