// Supabase Edge Function: close-expired-hangouts
// Schedule: every 5 minutes
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error } = await supabase
    .from("hangouts")
    .update({ is_active: false })
    .lt("closes_at", new Date().toISOString())
    .eq("is_active", true);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }));
});
