import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

const tabs = [
  { label: "Discover", path: "/app/discover" },
  { label: "+ Hangout", path: "/app/create" },
  { label: "Chats", path: "/app/chats" }
];

export default function AppShell() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();

  async function onMenuAction(action) {
    if (action === "Settings") {
      navigate("/app/settings");
      return;
    }
    if (action === "Profile") {
      navigate("/app/profile");
      return;
    }

    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      // noop
    }
  }

  return (
    <div className="min-h-screen bg-[var(--deep-black)]">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="group relative">
            <h1 className="cursor-default font-display text-2xl tracking-[0.25em] text-white">
              RAFI<span className="text-[var(--magenta)]">KI</span>
            </h1>
            <div className="pointer-events-none absolute left-0 top-10 w-72 rounded-2xl border border-[#1d1d1d] bg-[#111] p-3 opacity-0 shadow-2xl transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-1 group-hover:opacity-100">
              <p className="mantra-tech text-xs text-[var(--neon-green)]">nonchalance is boring, don't be boring</p>
              <div className="mt-3 grid gap-2">
                {["Settings", "Profile", "Logout"].map((action, idx) => (
                  <button
                    key={action}
                    type="button"
                    className="dropdown-nav-item rounded-lg border border-[#222] bg-[#151515] px-3 py-2 text-left text-xs font-bold text-white hover:border-[rgba(0,200,81,0.4)]"
                    style={{ transitionDelay: `${idx * 60}ms` }}
                    onClick={() => onMenuAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-full border border-[#1e1e1e] bg-[#0e0e0e] p-1">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-xs font-bold transition ${
                      isActive ? "bg-[var(--bold-green)] text-black" : "text-[#c4c4c4] hover:text-white"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
