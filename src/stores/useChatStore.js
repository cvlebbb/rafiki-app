import { create } from "zustand";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";
import { useToastStore } from "./useToastStore";
import { minutesUntil } from "../utils/helpers";
import { fetchMembershipBasicRowsForUser, fetchMembershipRowsForUser } from "../utils/membershipQueries";

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

function summarizeCountdown(expiresAt) {
  const mins = minutesUntil(expiresAt);
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function hangoutDateTime(hangout) {
  if (hangout.time && hangout.date) return `${hangout.date}T${hangout.time}`;
  if (hangout.event_date) return hangout.event_date;
  return new Date().toISOString();
}

function isLegacyChatId(chatId) {
  return `${chatId}`.startsWith("legacy-");
}

function legacyHangoutId(chatId) {
  return `${chatId}`.replace("legacy-", "");
}

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  loading: false,
  userChatChannel: null,
  activeChatChannel: null,

  setActiveChat: (chat) => set({ activeChat: chat }),

  fetchUserChats: async (userId) => {
    if (!userId || !supabase) {
      set({ chats: [] });
      return;
    }

    set({ loading: true });
    try {
      const client = requireSupabase();

      const rowsWithChat = await fetchMembershipRowsForUser(userId);
      let mapped = rowsWithChat
        .map((row) => {
          const hangout = row.hangouts;
          const chat = hangout?.group_chats;
          if (!chat?.id) return null;
          return {
            id: chat.id,
            hangout_id: hangout.id,
            name: chat.name || hangout.title,
            category: hangout.category || "General",
            is_active: chat.is_active,
            expires_at: chat.expires_at,
            last_message: "",
            last_message_time: chat.expires_at || hangoutDateTime(hangout),
            unread: 0,
            legacy: false
          };
        })
        .filter(Boolean);

      // Legacy fallback: no group_chats table/relation available
      if (mapped.length === 0) {
        const basicRows = await fetchMembershipBasicRowsForUser(userId);
        mapped = basicRows
          .map((row) => {
            const hangout = row.hangouts;
            if (!hangout?.id) return null;
            return {
              id: `legacy-${hangout.id}`,
              hangout_id: hangout.id,
              name: hangout.title,
              category: hangout.category || "General",
              is_active: true,
              expires_at: null,
              last_message: "",
              last_message_time: hangoutDateTime(hangout),
              unread: 0,
              legacy: true
            };
          })
          .filter(Boolean);
      }

      if (mapped.length) {
        const modernChatIds = mapped.filter((c) => !c.legacy).map((c) => c.id);
        const legacyHangoutIds = mapped.filter((c) => c.legacy).map((c) => c.hangout_id);

        if (modernChatIds.length) {
          const { data: latestMessages } = await client
            .from("messages")
            .select("chat_id, content, created_at")
            .in("chat_id", modernChatIds)
            .order("created_at", { ascending: false });

          const seen = new Set();
          for (const item of latestMessages || []) {
            if (seen.has(item.chat_id)) continue;
            seen.add(item.chat_id);
            const target = mapped.find((chat) => chat.id === item.chat_id);
            if (target) {
              target.last_message = item.content;
              target.last_message_time = item.created_at;
            }
          }
        }

        if (legacyHangoutIds.length) {
          const { data: latestLegacy } = await client
            .from("messages")
            .select("hangout_id, text, created_at")
            .in("hangout_id", legacyHangoutIds)
            .order("created_at", { ascending: false });

          const seenLegacy = new Set();
          for (const item of latestLegacy || []) {
            if (seenLegacy.has(item.hangout_id)) continue;
            seenLegacy.add(item.hangout_id);
            const target = mapped.find((chat) => chat.hangout_id === item.hangout_id);
            if (target) {
              target.last_message = item.text;
              target.last_message_time = item.created_at;
            }
          }
        }
      }

      mapped.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

      set({
        chats: mapped,
        activeChat: get().activeChat || mapped[0] || null,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      useToastStore.getState().pushToast(error.message || "Could not load chats.", "⚠");
    }
  },

  fetchMessages: async (chatId) => {
    if (!chatId || !supabase) return;
    set({ loading: true });

    try {
      const client = requireSupabase();
      let rows = [];

      if (isLegacyChatId(chatId)) {
        const hangoutId = legacyHangoutId(chatId);
        const { data, error } = await client
          .from("messages")
          .select("*")
          .eq("hangout_id", hangoutId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        rows = (data || []).map((row) => ({ ...row, content: row.content || row.text || "" }));
      } else {
        const { data, error } = await client
          .from("messages")
          .select("*, profiles:sender_id(username,avatar_url)")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        rows = (data || []).map((row) => ({ ...row, content: row.content || row.text || "" }));
      }

      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: rows
        },
        loading: false
      }));
    } catch (error) {
      set({ loading: false });
      useToastStore.getState().pushToast(error.message || "Could not load messages.", "⚠");
    }
  },

  sendMessage: async (chatId, senderId, content) => {
    if (!chatId || !senderId || !supabase) return { ok: false, error: "Missing chat context." };
    const trimmed = content.trim();
    if (!trimmed) return { ok: false, error: "Message empty." };

    const targetChat = get().chats.find((chat) => chat.id === chatId);
    if (targetChat && !targetChat.is_active) {
      return { ok: false, error: "This group has ended." };
    }

    const client = requireSupabase();

    if (isLegacyChatId(chatId)) {
      const hangoutId = legacyHangoutId(chatId);
      const { data, error } = await client
        .from("messages")
        .insert({ hangout_id: hangoutId, sender_id: senderId, text: trimmed })
        .select("*")
        .single();

      if (error) return { ok: false, error: error.message };

      const normalized = { ...data, content: data.text || trimmed };
      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), normalized]
        },
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? { ...chat, last_message: trimmed, last_message_time: normalized.created_at }
            : chat
        )
      }));

      return { ok: true };
    }

    const { error } = await client.from("messages").insert({
      chat_id: chatId,
      sender_id: senderId,
      content: trimmed
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  subscribeToChat: (chatId) => {
    if (!chatId || !supabase || isLegacyChatId(chatId)) return () => {};

    get().activeChatChannel && supabase.removeChannel(get().activeChatChannel);

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const normalized = { ...payload.new, content: payload.new.content || payload.new.text || "" };
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: [...(state.messages[chatId] || []), normalized]
            }
          }));
        }
      )
      .subscribe();

    set({ activeChatChannel: channel });

    return () => {
      if (supabase) supabase.removeChannel(channel);
      set({ activeChatChannel: null });
    };
  },

  subscribeToUserChats: (userId) => {
    if (!userId || !supabase) return () => {};

    get().userChatChannel && supabase.removeChannel(get().userChatChannel);

    const channel = supabase
      .channel(`user-chats-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const chatId = payload.new.chat_id;
          if (!chatId) return;

          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    last_message: payload.new.content || payload.new.text || "",
                    last_message_time: payload.new.created_at,
                    unread: state.activeChat?.id === chatId ? 0 : (chat.unread || 0) + 1
                  }
                : chat
            )
          }));

          if (get().activeChat?.id === chatId) {
            const normalized = { ...payload.new, content: payload.new.content || payload.new.text || "" };
            set((state) => ({
              messages: {
                ...state.messages,
                [chatId]: [...(state.messages[chatId] || []), normalized]
              }
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "group_chats" },
        (payload) => {
          const next = payload.new;
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.id === next.id
                ? {
                    ...chat,
                    is_active: next.is_active,
                    expires_at: next.expires_at,
                    expiry_notice: !next.is_active
                      ? `This hangout has ended. Group deletes in ${summarizeCountdown(next.expires_at)}.`
                      : ""
                  }
                : chat
            )
          }));
        }
      )
      .subscribe();

    set({ userChatChannel: channel });

    return () => {
      if (supabase) supabase.removeChannel(channel);
      set({ userChatChannel: null });
    };
  }
}));