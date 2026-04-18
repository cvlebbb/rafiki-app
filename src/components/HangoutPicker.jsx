import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function TapToPlace({ onPick }) {
  useMapEvents({
    click: async (event) => {
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      onPick({ lat, lng, location_name: `${lat}, ${lng}` });
    }
  });
  return null;
}

export default function HangoutPicker({ value, onChange }) {
  const defaultCenter = useMemo(
    () => [value.lat || -1.286389, value.lng || 36.817223],
    [value.lat, value.lng]
  );
  const [query, setQuery] = useState(value.location_name || "");
  const [center, setCenter] = useState(defaultCenter);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setCenter(defaultCenter);
  }, [defaultCenter]);

  async function searchPlaces() {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: term,
        format: "json",
        limit: "6"
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const json = await response.json();
      setResults(Array.isArray(json) ? json : []);
    } catch (_error) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function applyResult(item) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    const location_name = item.display_name || query || "Selected location";
    setCenter([lat, lng]);
    setQuery(location_name);
    setResults([]);
    onChange({ lat, lng, location_name });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a place (OpenStreetMap)"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
        />
        <button type="button" className="secondary-btn shrink-0 px-4" onClick={searchPlaces} disabled={searching}>
          {searching ? "..." : "Find"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="max-h-40 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-white p-2">
          {results.map((item) => (
            <button
              type="button"
              key={item.place_id}
              onClick={() => applyResult(item)}
              className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-rafiki-purple/5"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/70">
        <MapContainer center={center} zoom={13} style={{ width: "100%", height: 240 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center} icon={markerIcon} />
          <TapToPlace
            onPick={(picked) => {
              setCenter([picked.lat, picked.lng]);
              onChange(picked);
            }}
          />
        </MapContainer>
      </div>

      <p className="text-xs text-slate-500">Tip: tap the map to drop a pin and auto-fill coordinates.</p>
    </div>
  );
}
