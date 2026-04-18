import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import { minutesUntil } from "../../utils/helpers";

function countdownLabel(expiresAt) {
  if (!expiresAt) return "";
  const mins = minutesUntil(expiresAt);
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ChatsPage() {
  const { user } = useAuthStore();
  const {
    chats,
    activeChat,
    messages,
    setActiveChat,
    fetchUserChats,
    fetchMessages,
    sendMessage,
    subscribeToChat,
    subscribeToUserChats
  } = useChatStore();

  const [draft, setDraft] = useState("");
  const threadRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserChats(user.id);
    const off = subscribeToUserChats(user.id);
    return () => off?.();
  }, [fetchUserChats, subscribeToUserChats, user?.id]);

  useEffect(() => {
    if (!activeChat?.id) return;
    fetchMessages(activeChat.id);
    const off = subscribeToChat(activeChat.id);
    return () => off?.();
  }, [activeChat?.id, fetchMessages, subscribeToChat]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, activeChat?.id]);

  const currentMessages = useMemo(
    () => (activeChat?.id ? messages[activeChat.id] || [] : []),
    [activeChat?.id, messages]
  );

  async function onSend(event) {
    event.preventDefault();
    if (!activeChat?.id || !user?.id) return;
    const result = await sendMessage(activeChat.id, user.id, draft);
    if (!result.ok) return;
    setDraft("");
  }

  return (
    <main className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-[#1d1d1d] bg-[#111] md:grid-cols-[300px_1fr]">
      <aside className="border-r border-[#1f1f1f]">
        <div className="border-b border-[#1f1f1f] p-4 text-sm font-bold text-[#a5a5a5]">Groups</div>
        <div className="max-h-[72vh] overflow-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => setActiveChat(chat)}
              className={`relative w-full border-b border-[#1a1a1a] px-4 py-3 text-left ${activeChat?.id === chat.id ? "bg-[#161616]" : "bg-[#111]"}`}
            >
              {activeChat?.id === chat.id && <span className="absolute right-0 top-0 h-full w-0.5 bg-[var(--bold-green)]" />}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{chat.name}</p>
                  <p className="truncate text-xs text-[#939393]">{chat.last_message || "No messages yet"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#828282]">{new Date(chat.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  {chat.unread > 0 && <span className="mt-1 inline-flex rounded-full bg-[var(--bold-green)] px-2 text-[10px] font-bold text-black">{chat.unread}</span>}
                </div>
              </div>
            </button>
          ))}
          {chats.length === 0 && <p className="p-4 text-sm text-[#838383]">Join a hangout to create your first group chat.</p>}
        </div>
      </aside>

      <section className="flex min-h-[72vh] flex-col">
        {activeChat ? (
          <>
            <header className="border-b border-[#1f1f1f] p-4">
              <p className="text-lg font-bold text-white">{activeChat.name}</p>
              <p className="text-xs text-[#8f8f8f]">{activeChat.is_active ? "active" : "inactive"}</p>
            </header>

            {!activeChat.is_active && (
              <div className="border-b border-red-900/40 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                This hangout has ended. Group deletes in {countdownLabel(activeChat.expires_at)}.
              </div>
            )}

            <div ref={threadRef} className="flex-1 space-y-3 overflow-auto bg-[#0d0d0d] p-4">
              {currentMessages.map((message) => {
                const mine = message.sender_id === user?.id;
                const system = message.is_system;
                return (
                  <div key={message.id} className={`max-w-[75%] ${mine ? "ml-auto" : "mr-auto"}`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm ${system ? "bg-[#1e1e1e] text-[#b8ffcc]" : mine ? "bg-[rgba(0,200,81,0.18)] text-[#d8ffe5]" : "bg-[#1b1b1b] text-[#e2e2e2]"}`}>
                      {message.content}
                    </div>
                    <p className="mt-1 text-[11px] text-[#7f7f7f]">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                );
              })}
            </div>

            <form onSubmit={onSend} className="border-t border-[#1f1f1f] bg-[#101010] p-3">
              <div className="flex gap-2">
                <input
                  className="input-shell"
                  placeholder={activeChat.is_active ? "Type a message" : "This group has ended"}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!activeChat.is_active}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      onSend(event);
                    }
                  }}
                />
                <button type="submit" className="btn-primary px-5" disabled={!activeChat.is_active}>Send</button>
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
