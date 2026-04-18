import { useMemo, useState } from "react";
import { useChatRoom } from "../hooks/useChatRoom";

export default function ChatRoom({ hangoutId, user }) {
  const { messages, loading, sendMessage } = useChatRoom(hangoutId);
  const [text, setText] = useState("");

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  );

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !user?.id) return;

    try {
      await sendMessage({ senderId: user.id, text: text.trim() });
      setText("");
    } catch (_err) {
      // Keep UI simple; parent-level error capture can be layered later.
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Group Chat</h3>
        <span className="rounded-full bg-rafiki-orange/20 px-3 py-1 text-xs font-semibold text-orange-700">Live</span>
      </div>

      <div className="mb-3 h-56 space-y-2 overflow-auto rounded-2xl bg-slate-100/70 p-3">
        {loading && <p className="text-sm text-slate-500">Loading messages...</p>}
        {!loading && sorted.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}

        {sorted.map((msg) => (
          <div key={msg.id} className="rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
            <p className="font-semibold text-rafiki-purple">{msg.sender_id?.slice(0, 8)}</p>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none ring-rafiki-purple/40 focus:ring"
          value={text}
          placeholder="Drop a message"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="cta-btn px-5" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
