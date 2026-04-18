import { createContext, useContext, useMemo, useState } from "react";
import { seededFriends, seededHangouts } from "../data/mockData";

const AppStateContext = createContext(null);

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createBotMessage(text) {
  return {
    id: `m-${crypto.randomUUID()}`,
    sender: "bot",
    text,
    time: nowLabel()
  };
}

function toDate(h) {
  return new Date(`${h.date}T${h.time}:00`);
}

export function AppStateProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState({
    name: "Alex Rivera",
    handle: "@alexrivera",
    bio: "Hangout architect. Coffee over nonchalance.",
    initials: "AR"
  });
  const [hangouts, setHangouts] = useState(seededHangouts);
  const [joinedHangoutIds, setJoinedHangoutIds] = useState([]);
  const [chatGroups, setChatGroups] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [friends] = useState(seededFriends);

  function pushToast(message, icon = "✨") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, icon, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }

  function login(payload) {
    setIsAuthed(true);
    if (payload?.name) {
      setUser((prev) => ({
        ...prev,
        name: payload.name,
        handle: payload.handle || prev.handle,
        bio: payload.bio || prev.bio,
        initials: payload.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      }));
    }
  }

  function logout() {
    setIsAuthed(false);
    pushToast("You are logged out.", "👋");
  }

  function createHangout(form) {
    const required = ["title", "description", "date", "time", "category", "locationName"];
    const missing = required.find((key) => !form[key] || `${form[key]}`.trim() === "");
    if (missing) {
      return { ok: false, error: "Please complete all required fields." };
    }

    const next = {
      id: `h-${crypto.randomUUID()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      emoji: form.emoji || "🔥",
      date: form.date,
      time: form.time,
      budget: Number(form.budget || 0),
      capacity: Number(form.capacity || 2),
      joinedCount: 1,
      locationName: form.locationName,
      lat: Number(form.lat || -1.286389),
      lng: Number(form.lng || 36.817223),
      meetupStyle: form.meetupStyle,
      imageUrl: form.imageUrl || "",
      host: { name: user.name, handle: user.handle, avatar: user.initials[0] }
    };

    setHangouts((prev) => [next, ...prev]);
    setJoinedHangoutIds((prev) => [...new Set([next.id, ...prev])]);
    pushToast("Hangout posted to Discover.", "🚀");
    return { ok: true, hangout: next };
  }

  function ensureGroupForHangout(hangout) {
    setChatGroups((prev) => {
      const existing = prev.find((g) => g.hangoutId === hangout.id);
      if (existing) {
        setActiveChatId(existing.id);
        return prev;
      }
      const expired = toDate(hangout) < new Date();
      const group = {
        id: `g-${crypto.randomUUID()}`,
        hangoutId: hangout.id,
        name: hangout.title,
        emoji: hangout.emoji,
        lastMessage: "Rafiki Bot: Welcome to the group.",
        time: nowLabel(),
        unread: 1,
        expired,
        messages: [
          createBotMessage(`Welcome to ${hangout.title}. Keep it active, keep it bold.`)
        ]
      };
      setActiveChatId(group.id);
      return [group, ...prev];
    });
  }

  function joinHangout(hangoutId) {
    const hangout = hangouts.find((h) => h.id === hangoutId);
    if (!hangout) {
      return { ok: false, error: "Hangout not found." };
    }

    if (hangout.joinedCount >= hangout.capacity && !joinedHangoutIds.includes(hangoutId)) {
      return { ok: false, error: "This hangout is full." };
    }

    setJoinedHangoutIds((prev) => [...new Set([...prev, hangoutId])]);
    setHangouts((prev) =>
      prev.map((h) =>
        h.id === hangoutId
          ? { ...h, joinedCount: Math.min(h.capacity, h.joinedCount + (joinedHangoutIds.includes(hangoutId) ? 0 : 1)) }
          : h
      )
    );
    ensureGroupForHangout(hangout);
    pushToast(`Joined ${hangout.title}. Opening chat.`, "💬");
    return { ok: true };
  }

  function sendMessage(groupId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setChatGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (group.expired) return group;

        return {
          ...group,
          lastMessage: trimmed,
          time: nowLabel(),
          unread: 0,
          messages: [
            ...group.messages,
            {
              id: `m-${crypto.randomUUID()}`,
              sender: "me",
              text: trimmed,
              time: nowLabel()
            }
          ]
        };
      })
    );
  }

  const createdHangouts = useMemo(
    () => hangouts.filter((h) => h.host.handle === user.handle),
    [hangouts, user.handle]
  );

  const joinedCount = joinedHangoutIds.length;

  const value = {
    isAuthed,
    user,
    hangouts,
    chatGroups,
    activeChatId,
    toasts,
    friends,
    createdHangouts,
    joinedCount,
    setActiveChatId,
    login,
    logout,
    pushToast,
    createHangout,
    joinHangout,
    sendMessage
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
