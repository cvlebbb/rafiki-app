import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { formatDateLabel } from "../utils/helpers";

const markerIcon = L.divIcon({
  className: "custom-leaflet-dot",
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function HangoutDetailModal({
  hangout,
  me,
  isJoined,
  onClose,
  onJoin,
  isJoining
}) {
  if (!hangout) return null;

  const spotsLeft = Math.max(hangout.people_needed - hangout.member_count, 0);
  const progress = Math.min(100, Math.round((hangout.member_count / hangout.people_needed) * 100));
  const isCreator = hangout.created_by === me?.id;

  let joinState = { disabled: false, label: "Join Hangout →", className: "btn-primary" };

  if (isCreator) {
    joinState = { disabled: true, label: "Your Hangout", className: "btn-outline" };
  } else if (isJoined) {
    joinState = { disabled: true, label: "Already In", className: "btn-outline" };
  } else if (spotsLeft <= 0) {
    joinState = { disabled: true, label: "Hangout Full", className: "btn-outline" };
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl border border-[#202020] bg-[#0f0f0f]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#1d1d1d] p-5">
          <div>
            <h2 className="font-display text-3xl text-white">{hangout.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="tag-green">{hangout.category}</span>
              <span className="tag-magenta">{hangout.meetup_style === "common_point" ? "Meet at common point first" : "Go straight to venue"}</span>
            </div>
          </div>
          <button type="button" className="btn-outline px-4 py-2" onClick={onClose}>Close</button>
        </div>

        <div className="p-5">
          <div className="mb-4 grid h-48 place-items-center rounded-2xl border border-[#202020] bg-gradient-to-br from-[#182818] via-[#242424] to-[#2a1124] text-6xl">
            {hangout.emoji}
          </div>

          <p className="text-[#d0d0d0]">{hangout.description}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="input-shell"><p className="text-xs text-[#888]">Date & Time</p><p className="text-white">{formatDateLabel(hangout.date, hangout.time)}</p></div>
            <div className="input-shell"><p className="text-xs text-[#888]">Budget</p><p className="text-white">KES {hangout.budget}</p></div>
            <div className="input-shell"><p className="text-xs text-[#888]">Spots</p><p className="text-white">{spotsLeft} left / {hangout.people_needed}</p></div>
            <div className="input-shell"><p className="text-xs text-[#888]">Meetup Style</p><p className="text-white">{hangout.meetup_style === "common_point" ? "Meet at common point first" : "Go straight to venue"}</p></div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-white">{hangout.location_name}</p>
            <div className="h-56 overflow-hidden rounded-2xl border border-[#1f1f1f]">
              <MapContainer
                center={[hangout.latitude || -1.286389, hangout.longitude || 36.817223]}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                keyboard={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <Marker
                  position={[hangout.latitude || -1.286389, hangout.longitude || 36.817223]}
                  icon={markerIcon}
                />
              </MapContainer>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#1f1f1f] bg-[#131313] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(0,200,81,0.4)] bg-[#191919] text-sm font-bold text-[var(--bold-green)]">
                {(hangout.host_username || "H").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">@{hangout.host_username || "host"}</p>
                <p className="text-xs text-[#888]">Hangout host</p>
              </div>
            </div>
            <button
              type="button"
              className={`${joinState.className} px-5 py-2`}
              disabled={joinState.disabled || isJoining}
              onClick={() => onJoin(hangout.id)}
            >
              {isJoining ? "Joining..." : joinState.label}
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[#a5a5a5]"><span>Deadline progress</span><span>{Math.round(progress)}%</span></div>
            <div className="h-2 w-full rounded-full bg-[#1f1f1f]"><div className="deadline-fill h-full rounded-full" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
