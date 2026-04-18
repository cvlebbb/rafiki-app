import { useMemo, useState } from "react";
import HangoutPicker from "./HangoutPicker";
import { createHangout } from "../lib/hangouts";

const initialState = {
  title: "",
  description: "",
  event_date: "",
  budget: "",
  max_slots: 8,
  meetup_type: "venue",
  location_name: "",
  lat: -1.286389,
  lng: 36.817223
};

export default function HangoutForm({ user }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");

  const canContinue = useMemo(() => {
    if (step === 1) return form.title.trim().length >= 3 && form.description.trim().length >= 10;
    if (step === 2) return Boolean(form.event_date) && Number(form.max_slots) > 1;
    if (step === 3) return Boolean(form.location_name);
    return true;
  }, [form, step]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!user?.id) return;

    try {
      setSaving(true);
      setMessage("");

      await createHangout(
        {
          title: form.title,
          description: form.description,
          event_date: form.event_date,
          budget: Number(form.budget || 0),
          max_slots: Number(form.max_slots),
          meetup_type: form.meetup_type,
          location_name: form.location_name,
          lat: Number(form.lat),
          lng: Number(form.lng),
          status: "open"
        },
        user.id
      );

      setMessage("Hangout created. Let the squad know.");
      setForm(initialState);
      setStep(1);
    } catch (error) {
      setMessage(error.message || "Could not create hangout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create Hangout</h3>
        <span className="rounded-full bg-rafiki-purple/10 px-3 py-1 text-xs font-semibold text-rafiki-purple">Step {step}/3</span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
          <textarea
            className="h-28 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="datetime-local"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            value={form.event_date}
            onChange={(e) => updateField("event_date", e.target.value)}
          />
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            placeholder="Budget"
            value={form.budget}
            onChange={(e) => updateField("budget", e.target.value)}
          />
          <input
            type="number"
            min="2"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            placeholder="Max slots"
            value={form.max_slots}
            onChange={(e) => updateField("max_slots", e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            value={form.meetup_type}
            onChange={(e) => updateField("meetup_type", e.target.value)}
          >
            <option value="venue">Venue</option>
            <option value="pre-meet">Pre-meet</option>
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <HangoutPicker
            value={form}
            onChange={({ location_name, lat, lng }) => {
              updateField("location_name", location_name);
              updateField("lat", lat);
              updateField("lng", lng);
            }}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-rafiki-purple/40 focus:ring"
            value={form.location_name}
            placeholder="Location name"
            onChange={(e) => updateField("location_name", e.target.value)}
          />
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {step > 1 && (
          <button className="secondary-btn flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="cta-btn flex-1 disabled:opacity-50" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button className="cta-btn flex-1 disabled:opacity-50" disabled={!canContinue || saving} onClick={submit}>
            {saving ? "Creating..." : "Publish Hangout"}
          </button>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
