export const categories = [
  "All",
  "Today",
  "This Weekend",
  "Food & Drink",
  "Music & Events",
  "Outdoor",
  "Arts & Culture"
];

export const seededHangouts = [
  {
    id: "h1",
    title: "Midnight Ramen Rally",
    description: "Street ramen crawl, loud laughs, and spontaneous karaoke after stop three.",
    category: "Food & Drink",
    emoji: "🍜",
    date: "2026-04-19",
    time: "19:30",
    budget: 1800,
    capacity: 12,
    joinedCount: 7,
    locationName: "Westlands Food Lane, Nairobi",
    lat: -1.2677,
    lng: 36.8093,
    meetupStyle: "Go straight to venue",
    host: { name: "Tariq", handle: "@tariq.codes", avatar: "T" }
  },
  {
    id: "h2",
    title: "Neon Rooftop DJ Circle",
    description: "Sunset house set, skyline photos, and no boring dance floor energy.",
    category: "Music & Events",
    emoji: "🎧",
    date: "2026-04-20",
    time: "18:00",
    budget: 2500,
    capacity: 20,
    joinedCount: 14,
    locationName: "Kilimani Skydeck",
    lat: -1.2921,
    lng: 36.7839,
    meetupStyle: "Meet at common point first",
    host: { name: "Nia", handle: "@nia.live", avatar: "N" }
  },
  {
    id: "h3",
    title: "Ngong Trail Sunrise Sprint",
    description: "Fast-paced trail run then coffee and chaotic storytelling at base camp.",
    category: "Outdoor",
    emoji: "🥾",
    date: "2026-04-21",
    time: "05:45",
    budget: 900,
    capacity: 10,
    joinedCount: 4,
    locationName: "Ngong Hills Gate 2",
    lat: -1.3612,
    lng: 36.6718,
    meetupStyle: "Meet at common point first",
    host: { name: "Musa", handle: "@musa.moves", avatar: "M" }
  },
  {
    id: "h4",
    title: "Canvas & Chaos Night",
    description: "Paint, sip, and build a collective mural that should not make sense but somehow does.",
    category: "Arts & Culture",
    emoji: "🎨",
    date: "2026-04-26",
    time: "20:00",
    budget: 2200,
    capacity: 16,
    joinedCount: 9,
    locationName: "Lavington Art House",
    lat: -1.2798,
    lng: 36.7635,
    meetupStyle: "Go straight to venue",
    host: { name: "Ayo", handle: "@ayo.creates", avatar: "A" }
  }
];

export const seededFriends = [
  { id: "f1", name: "Sarah Chen", mutualHangouts: 6, initials: "SC" },
  { id: "f2", name: "Marcus Johnson", mutualHangouts: 4, initials: "MJ" },
  { id: "f3", name: "Emma Rodriguez", mutualHangouts: 7, initials: "ER" },
  { id: "f4", name: "David Kim", mutualHangouts: 3, initials: "DK" }
];
