export const CATEGORY_EMOJI = {
  "Food & Drink": "🍜",
  "Music & Events": "🎧",
  Outdoor: "🥾",
  "Arts & Culture": "🎨"
};

export function categoryEmoji(category) {
  return CATEGORY_EMOJI[category] || "✨";
}

export function formatDateLabel(date, time) {
  if (!date || !time) return "TBD";
  const d = new Date(`${date}T${time}`);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function isWeekend(dateString) {
  if (!dateString) return false;
  const d = new Date(`${dateString}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function minutesUntil(isoDate) {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.floor(diff / 60000);
}

export function toIsoDate(date, time) {
  return new Date(`${date}T${time}`).toISOString();
}

export function normalizeText(value) {
  return `${value || ""}`.trim();
}
