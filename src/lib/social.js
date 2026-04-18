import { supabase } from "./supabaseClient";

export async function getMutualFriends(targetUserId) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) throw new Error("You must be logged in to view mutual friends.");

  const currentUserId = user.id;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, friends")
    .in("id", [currentUserId, targetUserId]);

  if (error) throw error;

  const me = data.find((row) => row.id === currentUserId)?.friends || [];
  const target = data.find((row) => row.id === targetUserId)?.friends || [];

  const targetSet = new Set(target);
  return me.filter((friendId) => targetSet.has(friendId));
}
