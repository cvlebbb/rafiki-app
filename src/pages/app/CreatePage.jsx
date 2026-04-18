import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useAuthStore } from "../../stores/useAuthStore";
import { useHangoutStore } from "../../stores/useHangoutStore";

const markerIcon = L.divIcon({ className: "custom-leaflet-dot", iconSize: [16, 16], iconAnchor: [8, 8] });

function ClickMarker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

function categoryEmoji(category) {
  switch (category) {
    case "Food & Drink":
      return "🍜";
    case "Music & Events":
      return "🎧";
    case "Outdoor":
      return "🥾";
    case "Arts & Culture":
      return "🎨";
    default:
      return "✨";
  }
}

export default function CreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createHangout } = useHangoutStore();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialDate = tomorrow.toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: initialDate,
    time: "19:00",
    budget: "",
    people_needed: 8,
    category: "Food & Drink",
    meetup_style: "common_point",
    location_name: "",
    latitude: -1.286389,
    longitude: 36.817223,
    imageFile: null,
    imagePreview: ""
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const json = await res.json();
      if (json?.display_name) {
        setField("location_name", json.display_name);
      }
    } catch {
      setField("location_name", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (form.title.trim().length > 80) nextErrors.title = "Max 80 characters.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    if (form.description.trim().length > 500) nextErrors.description = "Max 500 characters.";
    if (!form.date) nextErrors.date = "Date required.";
    if (!form.time) nextErrors.time = "Time required.";
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = "Budget must be positive.";
    if (Number(form.people_needed) < 2 || Number(form.people_needed) > 50) nextErrors.people_needed = "Must be between 2 and 50.";
    if (!form.location_name.trim()) nextErrors.location_name = "Location is required.";

    if (new Date(`${form.date}T${form.time}`).getTime() <= Date.now()) {
      nextErrors.date = "Use a future date/time.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await createHangout(form);
    setSubmitting(false);

    if (!result.ok) {
      setErrors((prev) => ({ ...prev, form: result.error }));
      return;
    }

    navigate("/app/discover");
  }

  const preview = useMemo(
    () => ({
      title: form.title || "Your Hangout Title",
      description: form.description || "Live preview updates with each keystroke.",
      date: form.date,
      time: form.time,
      budget: form.budget || 0,
      category: form.category,
      spots: Math.max(Number(form.people_needed || 0) - 1, 0),
      emoji: categoryEmoji(form.category),
      location: form.location_name || "Location pending",
      meetupStyle: form.meetup_style === "common_point" ? "Meet at common point first" : "Go straight to venue"
    }),
    [form]
  );

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-6">
      <form className="space-y-4 rounded-3xl border border-[#1d1d1d] bg-[#111] p-5" onSubmit={handleSubmit}>
        <h2 className="font-title text-3xl text-white">Create Hangout</h2>

        <div>
          <input className="input-shell" placeholder="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
        </div>

        <div>
          <textarea className="input-shell h-28 resize-none" placeholder="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} />
          {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <input className="input-shell" type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
            {errors.date && <p className="mt-1 text-xs text-red-400">{errors.date}</p>}
          </div>
          <div>
            <input className="input-shell" type="time" value={form.time} onChange={(e) => setField("time", e.target.value)} />
            {errors.time && <p className="mt-1 text-xs text-red-400">{errors.time}</p>}
          </div>
          <div>
            <input className="input-shell" type="number" min="1" placeholder="Budget (KES)" value={form.budget} onChange={(e) => setField("budget", e.target.value)} />
            {errors.budget && <p className="mt-1 text-xs text-red-400">{errors.budget}</p>}
          </div>
          <div>
            <input className="input-shell" type="number" min="2" max="50" placeholder="People needed" value={form.people_needed} onChange={(e) => setField("people_needed", e.target.value)} />
            {errors.people_needed && <p className="mt-1 text-xs text-red-400">{errors.people_needed}</p>}
          </div>
        </div>

        <select className="input-shell" value={form.category} onChange={(e) => setField("category", e.target.value)}>
          <option>Food & Drink</option>
          <option>Music & Events</option>
          <option>Outdoor</option>
          <option>Arts & Culture</option>
        </select>

        <div className="rounded-full border border-[#202020] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button type="button" className={`rounded-full px-3 py-2 text-xs font-bold ${form.meetup_style === "common_point" ? "bg-[var(--bold-green)] text-black" : "text-[#acacac]"}`} onClick={() => setField("meetup_style", "common_point")}>
              Meet at common point first
            </button>
            <button type="button" className={`rounded-full px-3 py-2 text-xs font-bold ${form.meetup_style === "direct" ? "bg-[var(--bold-green)] text-black" : "text-[#acacac]"}`} onClick={() => setField("meetup_style", "direct")}>
              Go straight to venue
            </button>
          </div>
        </div>

        <div>
          <input className="input-shell" placeholder="Location" value={form.location_name} onChange={(e) => setField("location_name", e.target.value)} />
          {errors.location_name && <p className="mt-1 text-xs text-red-400">{errors.location_name}</p>}
        </div>

        <div className="h-60 overflow-hidden rounded-2xl border border-[#1f1f1f]">
          <MapContainer center={[form.latitude, form.longitude]} zoom={13} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[form.latitude, form.longitude]} icon={markerIcon} />
            <ClickMarker
              onPick={(lat, lng) => {
                setField("latitude", Number(lat.toFixed(6)));
                setField("longitude", Number(lng.toFixed(6)));
                reverseGeocode(lat, lng);
              }}
            />
          </MapContainer>
        </div>

        <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[rgba(0,200,81,0.45)] bg-[#121212] p-4 text-sm text-[#8f8f8f]">
          Optional image upload
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setField("imageFile", file);
              const reader = new FileReader();
              reader.onload = () => setField("imagePreview", String(reader.result || ""));
              reader.readAsDataURL(file);
            }}
          />
        </label>

        {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting || !user}>
          {submitting ? "Posting..." : "Post Hangout"}
        </button>
      </form>

      <aside className="h-fit rounded-3xl border border-[#1d1d1d] bg-[#111] p-4 lg:sticky lg:top-24">
        <p className="mb-3 text-sm font-semibold text-[#9d9d9d]">Live Preview</p>
        <div className="rafiki-card overflow-hidden">
          <div className="grid h-36 place-items-center bg-gradient-to-br from-[#11391f] via-[#1c1c1c] to-[#3c1435] text-5xl">
            {form.imagePreview ? <img src={form.imagePreview} alt="preview" className="h-full w-full object-cover" /> : preview.emoji}
          </div>
          <div className="p-4">
            <h3 className="font-display text-xl text-white">{preview.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-[#b3b3b3]">{preview.description}</p>
            <div className="mt-3 grid gap-2 text-xs text-[#9a9a9a] sm:grid-cols-2">
              <p>{preview.date} · {preview.time}</p>
              <p>{preview.spots} spots left</p>
              <p>KES {preview.budget}</p>
              <p className="truncate">{preview.location}</p>
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
