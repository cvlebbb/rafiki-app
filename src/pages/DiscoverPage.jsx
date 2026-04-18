import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { categories } from "../data/mockData";
import { useAppState } from "../state/AppState";
import HangoutCard from "../components/HangoutCard";
import HangoutDetailModal from "../components/HangoutDetailModal";

function byFilter(hangout, filter) {
  if (filter === "All") return true;
  if (filter === "Today") {
    return hangout.date === new Date().toISOString().slice(0, 10);
  }
  if (filter === "This Weekend") {
    const date = new Date(`${hangout.date}T${hangout.time}:00`);
    return [0, 6].includes(date.getDay());
  }
  return hangout.category === filter;
}

export default function DiscoverPage() {
  const { hangouts, joinHangout } = useAppState();
  const [activeFilter, setActiveFilter] = useState("All");
  const { id } = useParams();
  const navigate = useNavigate();

  const filtered = useMemo(
    () => hangouts.filter((hangout) => byFilter(hangout, activeFilter)),
    [activeFilter, hangouts]
  );

  const selected = useMemo(
    () => hangouts.find((hangout) => hangout.id === id),
    [hangouts, id]
  );

  function openModal(hangoutId) {
    navigate(`/app/discover/${hangoutId}`);
  }

  function closeModal() {
    navigate("/app/discover");
  }

  function handleJoin(hangoutId) {
    const result = joinHangout(hangoutId);
    if (!result.ok) return;
    closeModal();
    navigate("/app/chats");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="mb-4 rounded-2xl border border-[#1d1d1d] bg-[#111] p-4">
        <div className="hide-scrollbar flex gap-2 overflow-auto">
          {categories.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
                activeFilter === filter ? "border border-[var(--bold-green)] bg-[rgba(0,200,81,0.15)] text-[var(--bold-green)]" : "border border-[#222] bg-[#121212] text-[#b0b0b0]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {filtered.map((hangout) => (
          <HangoutCard key={hangout.id} hangout={hangout} onOpen={openModal} />
        ))}
      </section>

      {id && selected && (
        <HangoutDetailModal hangout={selected} onClose={closeModal} onJoin={handleJoin} />
      )}
    </main>
  );
}
