import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

const features = [
  { icon: "⚡", title: "Instant Crews", description: "Assemble people fast, without dead group chats." },
  { icon: "🗺", title: "Geo-Ready", description: "Map-first planning with live location context." },
  { icon: "💬", title: "Auto Group Chat", description: "Every join opens chat momentum immediately." },
  { icon: "🎯", title: "Deadline Pressure", description: "Progress bars push decisions before it's stale." },
  { icon: "🎵", title: "Vibe Categories", description: "Food, music, outdoor, arts and more." },
  { icon: "🟢", title: "Realtime Updates", description: "Live hangout and chat updates with Supabase." }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate("/app/discover", { replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="landing-grid-bg min-h-screen bg-[var(--deep-black)] text-white">
      <div className="orb orb-green" />
      <div className="orb orb-magenta" />
      <div className="orb orb-gold" />

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <h1 className="font-display text-2xl tracking-[0.25em]">RAFI<span className="text-[var(--magenta)]">KI</span></h1>
          <div className="flex items-center gap-2">
            <Link className="btn-outline px-5 py-2" to="/login">Login</Link>
            <Link className="btn-primary px-5 py-2" to="/signup">Join</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6">
        <section className="text-center">
          <span className="tag-green inline-flex">Now live · Find your crew</span>
          <h2 className="mt-6 font-display text-5xl leading-tight md:text-7xl">
            <span className="block">YOUR FRIENDS</span>
            <span className="neon-green block">SAID NO.</span>
            <span className="neon-magenta block">WE SAID GO.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#b8b8b8] md:text-lg">
            Rafiki is the social launchpad for spontaneous hangouts. Build plans fast, join bold people, and keep the vibe moving.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary px-6 py-3">Join Free</Link>
            <Link to="/login" className="btn-magenta px-6 py-3">I have an account</Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rafiki-card p-5">
              <p className="text-2xl">{feature.icon}</p>
              <h3 className="mt-3 font-title text-xl text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#a7a7a7]">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-20 text-center">
          <p className="mantra-shadow font-display text-3xl tracking-[0.2em] md:text-5xl">
            NONCHALANCE IS BORING, DON'T BE BORING.
          </p>
          <p className="mantra-gradient mt-[-1.8rem] font-display text-3xl tracking-[0.2em] md:mt-[-2.7rem] md:text-5xl">
            NONCHALANCE IS BORING, DON'T BE BORING.
          </p>
        </section>
      </main>
    </div>
  );
}
