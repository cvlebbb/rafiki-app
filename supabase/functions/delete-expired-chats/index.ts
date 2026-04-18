// Supabase Edge Function: delete-expired-chats
// Schedule: every 10 minutes
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = new Date().toISOString();

  const { data: toExpire } = await supabase
    .from("group_chats")
    .select("id,name")
    .lt("expires_at", now)
    .eq("is_active", true);

  if (toExpire?.length) {
    await supabase
      .from("group_chats")
      .update({ is_active: false })
      .lt("expires_at", now)
      .eq("is_active", true);

    for (const chat of toExpire) {
      await supabase.channel(`chat-expiry-${chat.id}`).send({
        type: "broadcast",
        event: "chat_expired",
        payload: { chatId: chat.id, name: chat.name }
      });
    }
  }

  const deleteThreshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("group_chats")
    .delete()
    .lt("expires_at", deleteThreshold);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }));
});
