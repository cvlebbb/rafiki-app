import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useAppState } from "../state/AppState";

const markerIcon = L.divIcon({
  className: "custom-leaflet-dot",
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const categoryOptions = ["Food & Drink", "Music & Events", "Outdoor", "Arts & Culture"];

function MapClicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

export default function CreatePage() {
  const { createHangout } = useAppState();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    budget: "",
    capacity: 8,
    category: "Food & Drink",
    meetupStyle: "Meet at common point first",
    locationName: "",
    lat: -1.286389,
    lng: 36.817223,
    emoji: "🔥",
    imageUrl: ""
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const result = createHangout(form);
    if (!result.ok) return;
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      budget: "",
      capacity: 8,
      category: "Food & Drink",
      meetupStyle: "Meet at common point first",
      locationName: "",
      lat: -1.286389,
      lng: 36.817223,
      emoji: "🔥",
      imageUrl: ""
    });
    navigate("/app/discover");
  }

  const previewSpots = Math.max(Number(form.capacity || 0) - 1, 0);

  const preview = useMemo(
    () => ({
      title: form.title || "Your Hangout Title",
      description: form.description || "Your hangout description appears here in real time.",
      date: form.date || "YYYY-MM-DD",
      time: form.time || "HH:MM",
      budget: form.budget || 0,
      category: form.category,
      emoji: form.emoji || "🔥",
      locationName: form.locationName || "Pick a location",
      meetupStyle: form.meetupStyle
    }),
    [form]
  );

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-6">
      <form className="space-y-4 rounded-3xl border border-[#1d1d1d] bg-[#111] p-5" onSubmit={submit}>
        <h2 className="font-title text-3xl text-white">Create Hangout</h2>

        <input className="input-shell w-full" placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} />
        <textarea className="input-shell h-28 w-full resize-none" placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-shell w-full" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          <input className="input-shell w-full" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
          <input className="input-shell w-full" type="number" min="0" placeholder="Budget (KES)" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
          <input className="input-shell w-full" type="number" min="2" placeholder="People count" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input-shell w-full" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input className="input-shell w-full" value={form.emoji} onChange={(e) => update("emoji", e.target.value)} placeholder="Emoji" />
        </div>

        <div className="rounded-full border border-[#202020] p-1">
          <div className="grid grid-cols-2 gap-1">
            {["Meet at common point first", "Go straight to venue"].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => update("meetupStyle", style)}
                className={`rounded-full px-3 py-2 text-xs font-bold ${
                  form.meetupStyle === style ? "bg-[var(--bold-green)] text-black" : "text-[#acacac]"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <input className="input-shell w-full" placeholder="Location" value={form.locationName} onChange={(e) => update("locationName", e.target.value)} />

        <div className="h-60 overflow-hidden rounded-2xl border border-[#1f1f1f]">
          <MapContainer center={[form.lat, form.lng]} zoom={13} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[form.lat, form.lng]} icon={markerIcon} />
            <MapClicker
              onPick={(lat, lng) => {
                update("lat", Number(lat.toFixed(6)));
                update("lng", Number(lng.toFixed(6)));
                update("locationName", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              }}
            />
          </MapContainer>
        </div>

        <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[rgba(0,200,81,0.45)] bg-[#121212] p-4 text-sm text-[#8f8f8f]">
          Optional image upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => update("imageUrl", String(reader.result || ""));
              reader.readAsDataURL(file);
            }}
          />
        </label>

        <button type="submit" className="btn-primary w-full py-3">Post Hangout</button>
      </form>

      <aside className="h-fit rounded-3xl border border-[#1d1d1d] bg-[#111] p-4 lg:sticky lg:top-24">
        <p className="mb-3 text-sm font-semibold text-[#9d9d9d]">Live Preview</p>
        <div className="rafiki-card overflow-hidden">
          <div className="grid h-36 place-items-center bg-gradient-to-br from-[#11391f] via-[#1c1c1c] to-[#3c1435] text-5xl">{preview.emoji}</div>
          <div className="p-4">
            <h3 className="font-display text-xl text-white">{preview.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-[#b3b3b3]">{preview.description}</p>
            <div className="mt-3 grid gap-2 text-xs text-[#9a9a9a] sm:grid-cols-2">
              <p>{preview.date} · {preview.time}</p>
              <p>{previewSpots} spots left</p>
              <p>KES {preview.budget}</p>
              <p className="truncate">{preview.locationName}</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="tag-magenta">{preview.meetupStyle}</span>
              <span className="tag-green">{preview.category}</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#1b1b1b]"><div className="deadline-fill h-full" style={{ width: "12%" }} /></div>
        </div>
      </aside>
    </main>
  );
}
