import { create } from "zustand";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";
import { useToastStore } from "./useToastStore";
import { useAuthStore } from "./useAuthStore";
import { categoryEmoji, isWeekend, normalizeText, toIsoDate } from "../utils/helpers";

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function ownerId(row) {
  return row.created_by ?? row.organizer_id ?? null;
}

function peopleNeeded(row) {
  return Number(row.people_needed ?? row.max_slots ?? 0);
}

function normalizedDate(row) {
  if (row.date) return row.date;
  if (row.event_date) return new Date(row.event_date).toISOString().slice(0, 10);
  return "";
}

function normalizedTime(row) {
  if (row.time) return `${row.time}`.slice(0, 5);
  if (row.event_date) {
    const d = new Date(row.event_date);
    return `${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
  }
  return "";
}

function normalizedMeetupStyle(row) {
  if (row.meetup_style) return row.meetup_style;
  if (row.meetup_type) return row.meetup_type === "pre-meet" ? "common_point" : "direct";
  return "common_point";
}

function isActiveRow(row) {
  if (typeof row.is_active === "boolean") return row.is_active;
  if (row.status) return row.status === "open";
  return true;
}

function closesAt(row) {
  return row.closes_at || row.event_date || null;
}

function normalizeHangout(row, memberCount = 0, host = null) {
  const needed = peopleNeeded(row);
  return {
    ...row,
    created_by: ownerId(row),
    people_needed: needed,
    date: normalizedDate(row),
    time: normalizedTime(row),
    meetup_style: normalizedMeetupStyle(row),
    location_name: row.location_name ?? row.location ?? "",
    latitude: Number(row.latitude ?? row.lat ?? -1.286389),
    longitude: Number(row.longitude ?? row.lng ?? 36.817223),
    category: row.category || "Outdoor",
    is_active: isActiveRow(row),
    closes_at: closesAt(row),
    host_username: host?.username || "unknown",
    host_avatar: host?.avatar_url || null,
    member_count: memberCount,
    spots_left: Math.max(needed - memberCount, 0),
    emoji: categoryEmoji(row.category || "Outdoor")
  };
}

async function fetchMemberCountMap(hangoutIds) {
  if (!hangoutIds.length) return {};
  const client = requireSupabase();

  const tryTables = [
    { name: "hangout_members", key: "hangout_id" },
    { name: "participants", key: "hangout_id" }
  ];

  for (const t of tryTables) {
    const { data, error } = await client.from(t.name).select(t.key).in(t.key, hangoutIds);
    if (!error) {
      return (data || []).reduce((acc, row) => {
        const key = row[t.key];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }
  }

  return {};
}

async function fetchHostMap(ownerIds) {
  if (!ownerIds.length) return {};
  const client = requireSupabase();
  const { data } = await client.from("profiles").select("id,username,avatar_url").in("id", ownerIds);
  return (data || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
}

async function isAlreadyMember(client, hangoutId, userId) {
  const checks = [
    client.from("hangout_members").select("id").eq("hangout_id", hangoutId).eq("user_id", userId).maybeSingle(),
    client.from("participants").select("hangout_id").eq("hangout_id", hangoutId).eq("user_id", userId).maybeSingle()
  ];

  for (const promise of checks) {
    const { data, error } = await promise;
    if (!error && data) return true;
  }
  return false;
}

async function addMember(client, hangoutId, userId) {
  const tries = [
    client.from("hangout_members").insert({ hangout_id: hangoutId, user_id: userId }),
    client.from("participants").insert({ hangout_id: hangoutId, user_id: userId })
  ];

  for (const p of tries) {
    const { error } = await p;
    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: false, duplicate: true };
  }

  return { ok: false, duplicate: false };
}

export const useHangoutStore = create((set, get) => ({
  hangouts: [],
  myHangouts: [],
  activeFilter: "All",
  loading: false,

  setFilter: (filter) => set({ activeFilter: filter }),

  getMemberCount: (hangoutId) => get().hangouts.find((item) => item.id === hangoutId)?.member_count || 0,

  fetchHangouts: async () => {
    if (!supabase) {
      set({ hangouts: [] });
      return;
    }

    set({ loading: true });
    try {
      const client = requireSupabase();
      const { data, error } = await client.from("hangouts").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).filter((row) => {
        if (!isActiveRow(row)) return false;
        const close = closesAt(row);
        if (!close) return true;
        return new Date(close).getTime() > Date.now();
      });

      const ids = rows.map((h) => h.id);
      const countMap = await fetchMemberCountMap(ids);
      const ownerIds = [...new Set(rows.map(ownerId).filter(Boolean))];
      const hosts = await fetchHostMap(ownerIds);

      const normalized = rows.map((row) => normalizeHangout(row, countMap[row.id] || 0, hosts[ownerId(row)]));
      set({ hangouts: normalized, loading: false });
    } catch (error) {
      set({ loading: false });
      useToastStore.getState().pushToast(error.message || "Could not load hangouts.", "⚠");
    }
  },

  fetchMyHangouts: async (userId) => {
    if (!userId || !supabase) return;
    set({ loading: true });
    try {
      const client = requireSupabase();
      let data = [];
      let error = null;

      ({ data, error } = await client.from("hangouts").select("*").eq("created_by", userId).order("created_at", { ascending: false }));
      if (error) {
        ({ data, error } = await client.from("hangouts").select("*").eq("organizer_id", userId).order("created_at", { ascending: false }));
      }
      if (error) throw error;

      set({ myHangouts: data || [], loading: false });
    } catch (error) {
      set({ loading: false });
      useToastStore.getState().pushToast(error.message || "Could not load your hangouts.", "⚠");
    }
  },

  createHangout: async (formData) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return { ok: false, error: "You must be logged in." };

    const title = normalizeText(formData.title);
    const description = normalizeText(formData.description);
    const locationName = normalizeText(formData.location_name || formData.locationName);

    if (!title || !description || !formData.date || !formData.time || !locationName) return { ok: false, error: "Please complete required fields." };
    if (title.length > 80) return { ok: false, error: "Title max is 80 chars." };
    if (description.length > 500) return { ok: false, error: "Description max is 500 chars." };
    if (new Date(toIsoDate(formData.date, formData.time)).getTime() <= Date.now()) return { ok: false, error: "Date/time must be in the future." };

    const needed = Number(formData.people_needed || formData.peopleNeeded);
    if (!Number.isInteger(needed) || needed < 2 || needed > 50) return { ok: false, error: "People needed must be between 2 and 50." };

    let imageUrl = formData.image_url || null;
    set({ loading: true });

    try {
      const client = requireSupabase();

      if (formData.imageFile) {
        try {
          const ext = formData.imageFile.name.split(".").pop() || "jpg";
          const path = `${profile.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await client.storage.from("hangout-images").upload(path, formData.imageFile, { upsert: false });
          if (!uploadError) {
            const { data: publicData } = client.storage.from("hangout-images").getPublicUrl(path);
            imageUrl = publicData.publicUrl;
          } else {
            useToastStore.getState().pushToast("Image upload failed; posting without image.", "⚠");
          }
        } catch {
          useToastStore.getState().pushToast("Image upload failed; posting without image.", "⚠");
        }
      }

      const newPayload = {
        created_by: profile.id,
        title,
        description,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        budget: Number(formData.budget),
        people_needed: needed,
        meetup_style: formData.meetup_style || formData.meetupStyle,
        location_name: locationName,
        latitude: Number(formData.latitude ?? formData.lat),
        longitude: Number(formData.longitude ?? formData.lng),
        image_url: imageUrl
      };

      const legacyPayload = {
        organizer_id: profile.id,
        title,
        description,
        location_name: locationName,
        lat: Number(formData.latitude ?? formData.lat),
        lng: Number(formData.longitude ?? formData.lng),
        event_date: toIsoDate(formData.date, formData.time),
        budget: Number(formData.budget),
        max_slots: needed,
        meetup_type: (formData.meetup_style || formData.meetupStyle) === "common_point" ? "pre-meet" : "venue",
        status: "open"
      };

      let inserted = null;
      let insertError = null;

      ({ data: inserted, error: insertError } = await client.from("hangouts").insert(newPayload).select("*").single());
      if (insertError) {
        ({ data: inserted, error: insertError } = await client.from("hangouts").insert(legacyPayload).select("*").single());
      }
      if (insertError || !inserted) throw insertError || new Error("Failed to create hangout.");

      const hangoutId = inserted.id;
      await addMember(client, hangoutId, profile.id);

      let chatId = null;
      const expiresAt = new Date(toIsoDate(normalizedDate(inserted), normalizedTime(inserted) || formData.time));
      expiresAt.setHours(expiresAt.getHours() + 1);

      const { data: chat, error: chatError } = await client
        .from("group_chats")
        .insert({ hangout_id: hangoutId, name: inserted.title, expires_at: expiresAt.toISOString() })
        .select("id")
        .single();

      if (!chatError && chat?.id) {
        chatId = chat.id;
        await client.from("messages").insert({
          chat_id: chat.id,
          sender_id: profile.id,
          content: "Hangout created! Share with friends or wait for people to discover it 🚀",
          is_system: true
        });
      } else {
        chatId = `legacy-${hangoutId}`;
        await client.from("messages").insert({
          hangout_id: hangoutId,
          sender_id: profile.id,
          text: "Hangout created! Share with friends or wait for people to discover it 🚀"
        });
      }

      const normalized = normalizeHangout(inserted, 1, { username: profile.username, avatar_url: profile.avatar_url });
      set((state) => ({ hangouts: [normalized, ...state.hangouts], myHangouts: [inserted, ...state.myHangouts], loading: false }));
      useToastStore.getState().pushToast("Hangout live! People can now discover it.", "🚀");
      return { ok: true, hangout: normalized, chatId };
    } catch (error) {
      set({ loading: false });
      return { ok: false, error: error.message || "Failed to create hangout." };
    }
  },

  joinHangout: async (hangoutId, userId) => {
    if (!supabase) return { ok: false, error: "Supabase not configured." };
    const client = requireSupabase();

    const { data: hangout, error: hangoutError } = await client.from("hangouts").select("*").eq("id", hangoutId).single();
    if (hangoutError || !hangout) return { ok: false, error: "Hangout not found." };

    if (ownerId(hangout) === userId) return { ok: false, error: "Your Hangout" };

    if (!isActiveRow(hangout) || (closesAt(hangout) && new Date(closesAt(hangout)).getTime() < Date.now())) {
      return { ok: false, error: "Hangout closed." };
    }

    if (await isAlreadyMember(client, hangoutId, userId)) return { ok: false, error: "Already In" };

    const memberMap = await fetchMemberCountMap([hangoutId]);
    if ((memberMap[hangoutId] || 0) >= peopleNeeded(hangout)) return { ok: false, error: "Full" };

    const add = await addMember(client, hangoutId, userId);
    if (!add.ok) return { ok: false, error: add.duplicate ? "Already In" : "Could not join" };

    let chatId = null;
    const { data: existingChat, error: existingChatError } = await client.from("group_chats").select("id").eq("hangout_id", hangoutId).maybeSingle();
    if (!existingChatError && existingChat?.id) {
      chatId = existingChat.id;
    } else if (!existingChatError) {
      const expiresAt = new Date(toIsoDate(normalizedDate(hangout), normalizedTime(hangout)));
      expiresAt.setHours(expiresAt.getHours() + 1);
      const { data: createdChat, error: createChatError } = await client
        .from("group_chats")
        .insert({ hangout_id: hangoutId, name: hangout.title, expires_at: expiresAt.toISOString() })
        .select("id")
        .single();
      if (!createChatError && createdChat?.id) {
        chatId = createdChat.id;
      }
    }

    if (chatId) {
      const username = useAuthStore.getState().profile?.username || "Someone";
      await client.from("messages").insert({ chat_id: chatId, sender_id: userId, content: `${username} just joined the hangout! 👋`, is_system: true });
    } else {
      chatId = `legacy-${hangoutId}`;
      const username = useAuthStore.getState().profile?.username || "Someone";
      await client.from("messages").insert({
        hangout_id: hangoutId,
        sender_id: userId,
        text: `${username} just joined the hangout! 👋`
      });
    }

    set((state) => ({
      hangouts: state.hangouts.map((h) =>
        h.id === hangoutId
          ? { ...h, member_count: h.member_count + 1, spots_left: Math.max(h.people_needed - (h.member_count + 1), 0) }
          : h
      )
    }));

    useToastStore.getState().pushToast("You're in! Welcome to the group chat.", "💬");
    return { ok: true, chatId };
  },

  filteredHangouts: () => {
    const filter = get().activeFilter;
    const all = get().hangouts;
    if (filter === "All") return all;
    if (filter === "Today") {
      const today = new Date().toISOString().slice(0, 10);
      return all.filter((h) => h.date === today);
    }
    if (filter === "This Weekend") return all.filter((h) => isWeekend(h.date));
    return all.filter((h) => h.category === filter);
  }
}));
