import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../state/AppState";

export default function ChatsPage() {
  const { chatGroups, activeChatId, setActiveChatId, sendMessage } = useAppState();
  const [draft, setDraft] = useState("");
  const threadRef = useRef(null);

  const active = useMemo(
    () => chatGroups.find((group) => group.id === activeChatId) || chatGroups[0] || null,
    [activeChatId, chatGroups]
  );

  useEffect(() => {
    if (!active && chatGroups.length > 0) {
      setActiveChatId(chatGroups[0].id);
    }
  }, [active, chatGroups, setActiveChatId]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [active?.messages]);

  function submit(event) {
    event.preventDefault();
    if (!active) return;
    sendMessage(active.id, draft);
    setDraft("");
  }

  return (
    <main className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-[#1d1d1d] bg-[#111] md:grid-cols-[300px_1fr]">
      <aside className="border-r border-[#1f1f1f]">
        <div className="border-b border-[#1f1f1f] p-4 text-sm font-bold text-[#a5a5a5]">Groups</div>
        <div className="max-h-[72vh] overflow-auto">
          {chatGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveChatId(group.id)}
              className={`relative w-full border-b border-[#1a1a1a] px-4 py-3 text-left ${active?.id === group.id ? "bg-[#161616]" : "bg-[#111]"}`}
            >
              {active?.id === group.id && <span className="absolute right-0 top-0 h-full w-0.5 bg-[var(--bold-green)]" />}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{group.emoji} {group.name}</p>
                  <p className="truncate text-xs text-[#939393]">{group.lastMessage}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#828282]">{group.time}</p>
                  {group.unread > 0 && <span className="mt-1 inline-flex rounded-full bg-[var(--bold-green)] px-2 text-[10px] font-bold text-black">{group.unread}</span>}
                </div>
              </div>
            </button>
          ))}
          {chatGroups.length === 0 && <p className="p-4 text-sm text-[#838383]">Join a hangout to create your first group chat.</p>}
        </div>
      </aside>

      <section className="flex min-h-[72vh] flex-col">
        {active ? (
          <>
            <header className="border-b border-[#1f1f1f] p-4">
              <p className="text-lg font-bold text-white">{active.emoji} {active.name}</p>
              <p className="text-xs text-[#8f8f8f]">{active.expired ? "Hangout expired" : "active now"}</p>
            </header>

            {active.expired && (
              <div className="border-b border-red-900/40 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                This hangout has ended. Group deletes in 1 hour.
              </div>
            )}

            <div ref={threadRef} className="flex-1 space-y-3 overflow-auto bg-[#0d0d0d] p-4">
              {active.messages.map((message) => (
                <div key={message.id} className={`max-w-[75%] ${message.sender === "me" ? "ml-auto" : "mr-auto"}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm ${message.sender === "me" ? "bg-[rgba(0,200,81,0.18)] text-[#d8ffe5]" : "bg-[#1b1b1b] text-[#e2e2e2]"}`}>
                    {message.text}
                  </div>
                  <p className="mt-1 text-[11px] text-[#7f7f7f]">{message.time}</p>
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="border-t border-[#1f1f1f] bg-[#101010] p-3">
              <div className="flex gap-2">
                <input
                  className="input-shell w-full"
                  placeholder={active.expired ? "Chat locked" : "Type a message"}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={active.expired}
                />
                <button type="submit" className="btn-primary px-5" disabled={active.expired}>Send</button>
              </div>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-[#828282]">No active group selected.</div>
        )}
      </section>
    </main>
  );
}
