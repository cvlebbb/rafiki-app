import { supabase } from "./supabaseClient";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export function resolveAvatarUrl(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture ||
    null
  );
}

export async function upsertProfileFromUser(user) {
  if (!user?.id) return;
  const client = requireSupabase();

  const profilePayload = {
    id: user.id,
    username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "rafiki-user",
    avatar_url: resolveAvatarUrl(user)
  };

  const { error } = await client
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (error) throw error;
}

export async function signInWithGoogle() {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;
}

export async function signOut() {
  const client = requireSupabase();
  const attempts = [undefined, { scope: "local" }];
  let lastError = null;

  for (const options of attempts) {
    const { error } = await client.auth.signOut(options);
    if (!error) return;
    lastError = error;
  }

  throw lastError || new Error("Could not sign out.");
}
