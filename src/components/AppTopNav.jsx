import { useAppState } from "../state/AppState";

const tabs = [
  { label: "Discover", path: "/app/discover" },
  { label: "+ Hangout", path: "/app/create" },
  { label: "Chats", path: "/app/chats" }
];

export default function AppTopNav({ pathname, onNavigate }) {
  const { logout, pushToast } = useAppState();

  function handleAction(action) {
    if (action === "Settings") {
      pushToast("Settings panel coming soon.", "⚙");
      return;
    }
    if (action === "Profile") {
      onNavigate("/app/profile");
      return;
    }
    logout();
    onNavigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="relative group">
          <h1 className="cursor-default text-xl font-black tracking-[0.2em] text-white">
            RAFI<span className="text-[var(--magenta)]">KI</span>
          </h1>

          <div className="pointer-events-none absolute left-0 top-8 w-72 rounded-2xl border border-[#1c1c1c] bg-[#111111] p-3 opacity-0 shadow-2xl transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-1 group-hover:opacity-100">
            <p className="mantra-tech text-xs text-[var(--neon-green)]">
              nonchalance is boring, don't be boring
            </p>
            <div className="mt-3 grid gap-2">
              {["Settings", "Profile", "Logout"].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className="dropdown-nav-item rounded-xl border border-[#222] bg-[#151515] px-3 py-2 text-left text-xs font-bold text-white hover:border-[rgba(0,200,81,0.4)]"
                  style={{ transitionDelay: `${index * 60}ms` }}
                  onClick={() => handleAction(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-full border border-[#1f1f1f] bg-[#0f0f0f] p-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const active = pathname.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => onNavigate(tab.path)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    active ? "bg-[var(--bold-green)] text-black" : "text-[#c5c5c5] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
