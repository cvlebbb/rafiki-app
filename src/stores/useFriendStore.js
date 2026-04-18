import { create } from "zustand";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";
import { useToastStore } from "./useToastStore";

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export const useFriendStore = create((set) => ({
  friends: [],
  pendingRequests: [],
  loading: false,

  fetchFriends: async (userId) => {
    if (!userId || !supabase) {
      set({ friends: [], pendingRequests: [] });
      return;
    }

    set({ loading: true });
    try {
      const client = requireSupabase();
      const { data, error } = await client
        .from("friendships")
        .select("*, requester:requester_id(id,username,avatar_url), addressee:addressee_id(id,username,avatar_url)")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;

      const accepted = [];
      const pending = [];

      (data || []).forEach((item) => {
        const other = item.requester_id === userId ? item.addressee : item.requester;
        if (!other) return;

        if (item.status === "accepted") {
          accepted.push({ ...other, friendship_id: item.id });
        } else if (item.status === "pending") {
          pending.push({
            ...other,
            friendship_id: item.id,
            requested_by_me: item.requester_id === userId
          });
        }
      });

      set({ friends: accepted, pendingRequests: pending, loading: false });
    } catch (error) {
      set({ loading: false });
      useToastStore.getState().pushToast(error.message || "Could not fetch friends.", "⚠");
    }
  },

  sendFriendRequest: async (requesterId, addresseeId) => {
    const client = requireSupabase();
    const { error } = await client.from("friendships").insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "pending"
    });

    if (error) throw error;
  },

  acceptRequest: async (friendshipId) => {
    const client = requireSupabase();
    const { error } = await client
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (error) throw error;
  }
}));
