import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HangoutCard from "../../components/HangoutCard";
import HangoutDetailModal from "../../components/HangoutDetailModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import { useHangoutStore } from "../../stores/useHangoutStore";
import { useToastStore } from "../../stores/useToastStore";
import { fetchUserHangoutIds } from "../../utils/membershipQueries";

const filters = ["All", "Today", "This Weekend", "Food & Drink", "Music & Events", "Outdoor", "Arts & Culture"];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    hangouts,
    loading,
    activeFilter,
    setFilter,
    fetchHangouts,
    joinHangout,
    filteredHangouts
  } = useHangoutStore();
  const { fetchUserChats, setActiveChat } = useChatStore();
  const { pushToast } = useToastStore();

  const [joining, setJoining] = useState(false);
  const [joinedSet, setJoinedSet] = useState(new Set());

  useEffect(() => {
    fetchHangouts();
  }, [fetchHangouts]);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    async function fetchJoined() {
      const ids = await fetchUserHangoutIds(user.id);
      setJoinedSet(new Set(ids));
    }

    fetchJoined();

    const channel = supabase
      .channel("hangouts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "hangouts" }, () => {
        fetchHangouts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHangouts, user?.id]);

  const list = useMemo(() => filteredHangouts(), [hangouts, activeFilter, filteredHangouts]);
  const selected = useMemo(() => hangouts.find((h) => h.id === id) || null, [hangouts, id]);

  async function handleJoin(hangoutId) {
    if (!user?.id) return;
    setJoining(true);
    const result = await joinHangout(hangoutId, user.id);
    setJoining(false);

    if (!result.ok) {
      pushToast(result.error || "Could not join hangout.", "⚠");
      return;
    }

    await fetchUserChats(user.id);
    const chats = useChatStore.getState().chats;
    const target = chats.find((chat) => chat.id === result.chatId);
    if (target) setActiveChat(target);

    navigate("/app/chats");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="mb-4 rounded-2xl border border-[#1d1d1d] bg-[#111] p-4">
        <div className="hide-scrollbar flex gap-2 overflow-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilter(filter)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
                activeFilter === filter
                  ? "border border-[var(--bold-green)] bg-[rgba(0,200,81,0.15)] text-[var(--bold-green)]"
                  : "border border-[#222] bg-[#121212] text-[#b0b0b0]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="mb-4 text-sm text-[#8f8f8f]">Loading hangouts...</p>}

      <section className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {list.map((hangout) => (
          <HangoutCard key={hangout.id} hangout={hangout} onClick={(item) => navigate(`/app/discover/${item.id}`)} />
        ))}
      </section>

      {selected && (
        <HangoutDetailModal
          hangout={selected}
          me={user}
          isJoined={joinedSet.has(selected.id)}
          onClose={() => navigate("/app/discover")}
          onJoin={handleJoin}
          isJoining={joining}
        />
      )}
    </main>
  );
}
