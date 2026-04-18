import { formatDateLabel } from "../utils/helpers";

const categoryGradients = {
  "Food & Drink": "from-[#4a2f1c] via-[#693c1f] to-[#9a5a22]",
  "Music & Events": "from-[#2a204a] via-[#4a2f9a] to-[#7e2f9a]",
  Outdoor: "from-[#0f3c2e] via-[#0e6c4a] to-[#0da56d]",
  "Arts & Culture": "from-[#3e1c3c] via-[#6d2362] to-[#944881]"
};

export default function HangoutCard({ hangout, onClick }) {
  const spotsLeft = Math.max(hangout.people_needed - hangout.member_count, 0);
  const progress = Math.min(100, Math.round((hangout.member_count / hangout.people_needed) * 100));

  let tagClass = "tag-green";
  if (spotsLeft === 1) tagClass = "tag-magenta";
  if (spotsLeft <= 0) tagClass = "tag-red";

  return (
    <article className="rafiki-card cursor-pointer overflow-hidden" onClick={() => onClick(hangout)}>
      <div className={`relative h-36 bg-gradient-to-br ${categoryGradients[hangout.category] || "from-[#1f2937] to-[#374151]"}`}>
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/30 px-2 py-1 text-[11px] font-bold text-white">
          {hangout.category}
        </span>
        <span className="absolute right-4 top-4 text-4xl">{hangout.emoji}</span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-xl text-white">{hangout.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-[#b3b3b3]">{hangout.description}</p>

        <div className="mt-3 grid gap-2 text-xs text-[#9a9a9a] sm:grid-cols-2">
          <p>{formatDateLabel(hangout.date, hangout.time)}</p>
          <p>{spotsLeft} spots left</p>
          <p>KES {hangout.budget}</p>
          <p className="truncate">{hangout.location_name}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full border border-[rgba(0,200,81,0.4)] bg-[#191919] text-xs font-bold text-[var(--bold-green)]">
              {(hangout.host_username || "U").slice(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#c8c8c8]">@{hangout.host_username || "host"}</span>
          </div>
          <span className={tagClass}>{spotsLeft <= 0 ? "Full" : `${spotsLeft} left`}</span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-[#1b1b1b]"><div className="deadline-fill h-full" style={{ width: `${progress}%` }} /></div>
    </article>
  );
}
