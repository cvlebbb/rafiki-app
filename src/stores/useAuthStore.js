import { create } from "zustand";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";
import { useToastStore } from "./useToastStore";

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

async function upsertProfile(userId, payload) {
  const client = requireSupabase();
  const { error } = await client
    .from("profiles")
    .upsert({ id: userId, ...payload }, { onConflict: "id" });
  if (error) throw error;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  authSubscription: null,

  initAuth: async () => {
    if (get().initialized) return;

    if (!hasSupabaseConfig || !supabase) {
      set({ loading: false, initialized: true });
      return;
    }

    set({ loading: true });
    const client = requireSupabase();

    try {
      const sessionPromise = client.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth session check timed out.")), 10000)
      );

      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
      if (error) throw error;

      const sessionUser = data.session?.user || null;
      set({ user: sessionUser, initialized: true });

      if (sessionUser?.id) {
        await get().fetchProfile(sessionUser.id);
      }

      const {
        data: { subscription }
      } = client.auth.onAuthStateChange(async (_event, session) => {
        const nextUser = session?.user || null;
        set({ user: nextUser });

        if (nextUser?.id) {
          await get().fetchProfile(nextUser.id);
        } else {
          set({ profile: null });
        }
      });

      set({ authSubscription: subscription });
    } catch (error) {
      useToastStore.getState().pushToast(error.message || "Could not initialize auth.", "⚠");
      set({ initialized: true, user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },

  stopAuthListener: () => {
    get().authSubscription?.unsubscribe();
    set({ authSubscription: null });
  },

  fetchProfile: async (userId) => {
    if (!userId || !supabase) return null;

    const client = requireSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      useToastStore.getState().pushToast(error.message, "⚠");
      return null;
    }

    if (!data) {
      const user = get().user;
      const usernameSeed = user?.email?.split("@")[0] || `user_${userId.slice(0, 8)}`;
      await upsertProfile(userId, {
        username: usernameSeed,
        avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
      });

      const { data: inserted } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      set({ profile: inserted || null });
      return inserted || null;
    }

    set({ profile: data });
    return data;
  },

  signInWithGoogle: async () => {
    const client = requireSupabase();
    set({ loading: true });
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    set({ loading: false });
    if (error) throw error;
  },

  signInWithEmail: async (email, password) => {
    const client = requireSupabase();
    set({ loading: true });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }

    set({ user: data.user });
    if (data.user?.id) {
      await get().fetchProfile(data.user.id);
    }
    set({ loading: false });
  },

  signUpWithEmail: async (email, password, username, fullName) => {
    const client = requireSupabase();
    set({ loading: true });

    const { data: existing } = await client
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      set({ loading: false });
      throw new Error("Username already taken.");
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username
        }
      }
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    if (data.user?.id) {
      await upsertProfile(data.user.id, {
        username,
        avatar_url: data.user.user_metadata?.avatar_url || null
      });
    }

    set({ user: data.user || null, loading: false });

    if (data.user?.id) {
      await get().fetchProfile(data.user.id);
    }

    return data;
  },

  signOut: async () => {
    if (!supabase) {
      set({ user: null, profile: null });
      return;
    }

    const client = requireSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null });
  },

  updateProfile: async ({ username, bio, avatarFile }) => {
    const client = requireSupabase();
    const currentUser = get().user;
    const currentProfile = get().profile;
    if (!currentUser?.id || !currentProfile) {
      throw new Error("No active user profile.");
    }

    let avatarUrl = currentProfile.avatar_url || null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() || "jpg";
      const path = `${currentUser.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await client.storage
        .from("profile-avatars")
        .upload(path, avatarFile, { upsert: false });
      if (uploadError) {
        throw new Error(uploadError.message || "Avatar upload failed.");
      }
      const { data } = client.storage.from("profile-avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    const finalUsername = (username || currentProfile.username || "").trim();
    if (!finalUsername) throw new Error("Username is required.");

    const { data: existing } = await client
      .from("profiles")
      .select("id")
      .eq("username", finalUsername)
      .neq("id", currentUser.id)
      .maybeSingle();

    if (existing) throw new Error("Username already taken.");

    const payload = {
      username: finalUsername,
      avatar_url: avatarUrl
    };

    const bioText = `${bio || ""}`.trim();
    let { error } = await client
      .from("profiles")
      .update({ ...payload, bio: bioText })
      .eq("id", currentUser.id);

    if (error) {
      // Backward compatibility for schemas without `bio`
      ({ error } = await client
        .from("profiles")
        .update(payload)
        .eq("id", currentUser.id));
    }
    if (error) throw error;

    await get().fetchProfile(currentUser.id);
  }
}));
