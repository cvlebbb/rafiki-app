import { useAppState } from "../state/AppState";

export default function ProfilePage() {
  const { user, createdHangouts, joinedCount, friends, hangouts, pushToast } = useAppState();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#1d1d1d] bg-gradient-to-r from-[#0f2519] via-[#291126] to-[#2f240d] p-6">
        <div className="landing-grid-bg absolute inset-0 opacity-30" />
        <div className="relative pt-16">
          <div className="-mt-24 inline-grid h-28 w-28 place-items-center rounded-3xl border-4 border-black bg-[#141414] text-3xl font-black text-[var(--neon-green)]">
            {user.initials}
          </div>
          <h1 className="mt-3 font-display text-4xl text-white">{user.name}</h1>
          <p className="text-sm text-[#b9b9b9]">{user.handle}</p>
          <p className="mt-2 max-w-2xl text-[#d2d2d2]">{user.bio}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Hangouts Created</p><p className="text-2xl font-bold text-white">{createdHangouts.length}</p></div>
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Friends</p><p className="text-2xl font-bold text-white">{friends.length}</p></div>
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Hangouts Joined</p><p className="text-2xl font-bold text-white">{joinedCount}</p></div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-title text-2xl text-white">Friends</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <article key={friend.id} className="rafiki-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(0,200,81,0.35)] bg-[#191919] font-bold text-[var(--bold-green)]">
                  {friend.initials}
                </div>
                <div>
                  <p className="font-semibold text-white">{friend.name}</p>
                  <p className="text-xs text-[#949494]">{friend.mutualHangouts} mutual hangouts</p>
                </div>
              </div>
              <button type="button" className="btn-outline mt-4 w-full py-2" onClick={() => pushToast(`Messaging ${friend.name}`, "💌")}>Message</button>
            </article>
          ))}

          <article className="grid place-items-center rounded-[20px] border border-dashed border-[rgba(0,200,81,0.45)] bg-[#121212] p-4 text-center">
            <p className="text-sm font-bold text-[var(--bold-green)]">+ Add Friends</p>
            <p className="mt-1 text-xs text-[#8b8b8b]">Bring your people in.</p>
          </article>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-title text-2xl text-white">Hangouts Created</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {createdHangouts.map((hangout) => (
            <article key={hangout.id} className="rafiki-card p-4">
              <p className="font-display text-lg text-white">{hangout.title}</p>
              <p className="mt-1 text-xs text-[#9a9a9a]">{hangout.date} · {hangout.time}</p>
            </article>
          ))}
          {createdHangouts.length === 0 && (
            <p className="text-sm text-[#8a8a8a]">No created hangouts yet. Launch one from + Hangout.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[#1d1d1d] bg-[#101010] p-4">
        <h2 className="font-title text-xl text-white">Community Snapshot</h2>
        <p className="mt-2 text-sm text-[#969696]">Total live hangouts: {hangouts.length}</p>
      </section>
    </main>
  );
}
