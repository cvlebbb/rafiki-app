import { supabase } from "../lib/supabaseClient";

async function tryQuery(builders) {
  for (const builder of builders) {
    const { data, error, count } = await builder();
    if (!error) return { data, count, ok: true };
  }
  return { data: null, count: 0, ok: false };
}

export async function fetchUserHangoutIds(userId) {
  if (!supabase || !userId) return [];
  const result = await tryQuery([
    () => supabase.from("hangout_members").select("hangout_id").eq("user_id", userId),
    () => supabase.from("participants").select("hangout_id").eq("user_id", userId)
  ]);
  return (result.data || []).map((row) => row.hangout_id);
}

export async function fetchUserJoinedCount(userId) {
  if (!supabase || !userId) return 0;
  const result = await tryQuery([
    () => supabase.from("hangout_members").select("*", { count: "exact", head: true }).eq("user_id", userId),
    () => supabase.from("participants").select("*", { count: "exact", head: true }).eq("user_id", userId)
  ]);
  return result.count || 0;
}

export async function fetchMembershipRowsForUser(userId) {
  if (!supabase || !userId) return [];
  const result = await tryQuery([
    () =>
      supabase
        .from("hangout_members")
        .select("hangout_id, hangouts!inner(id,title,date,time,event_date,category,group_chats(id,name,is_active,expires_at))")
        .eq("user_id", userId),
    () =>
      supabase
        .from("participants")
        .select("hangout_id, hangouts!inner(id,title,date,time,event_date,category,group_chats(id,name,is_active,expires_at))")
        .eq("user_id", userId)
  ]);
  return result.data || [];
}

export async function fetchMembershipBasicRowsForUser(userId) {
  if (!supabase || !userId) return [];
  const result = await tryQuery([
    () =>
      supabase
        .from("hangout_members")
        .select("hangout_id, hangouts!inner(id,title,date,time,event_date,category)")
        .eq("user_id", userId),
    () =>
      supabase
        .from("participants")
        .select("hangout_id, hangouts!inner(id,title,date,time,event_date,category)")
        .eq("user_id", userId)
  ]);
  return result.data || [];
}
