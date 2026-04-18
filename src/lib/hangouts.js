import { supabase } from "./supabaseClient";

export async function createHangout(payload, organizerId) {
  const { data, error } = await supabase
    .from("hangouts")
    .insert({ ...payload, organizer_id: organizerId })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("participants").insert({
    hangout_id: data.id,
    user_id: organizerId
  });

  return data;
}

export async function joinHangout(hangoutId, userId) {
  const { data: hangout, error: hangoutError } = await supabase
    .from("hangouts")
    .select("id, max_slots, status")
    .eq("id", hangoutId)
    .single();

  if (hangoutError) throw hangoutError;
  if (!hangout || hangout.status !== "open") {
    throw new Error("This hangout is not open for joining.");
  }

  const { count, error: countError } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("hangout_id", hangoutId);

  if (countError) throw countError;
  if (typeof hangout.max_slots === "number" && count >= hangout.max_slots) {
    throw new Error("No slots left for this hangout.");
  }

  const { error } = await supabase
    .from("participants")
    .insert({ hangout_id: hangoutId, user_id: userId });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already joined this hangout.");
    }
    throw error;
  }
}

export async function listOpenHangouts() {
  const { data, error } = await supabase
    .from("hangouts")
    .select("*, participants(count)")
    .eq("status", "open")
    .order("event_date", { ascending: true });

  if (error) throw error;
  return data;
}
