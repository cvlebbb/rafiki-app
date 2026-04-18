import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useChatRoom(hangoutId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const roomKey = useMemo(() => `chat-${hangoutId}`, [hangoutId]);

  useEffect(() => {
    if (!hangoutId) return;

    let isActive = true;

    async function loadInitial() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("hangout_id", hangoutId)
        .order("created_at", { ascending: true });

      if (!error && isActive) {
        setMessages(data || []);
      }
      if (isActive) setLoading(false);
    }

    loadInitial();

    const channel = supabase
      .channel(roomKey)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `hangout_id=eq.${hangoutId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [hangoutId, roomKey]);

  async function sendMessage({ senderId, text, mediaUrl = null }) {
    const { error } = await supabase.from("messages").insert({
      hangout_id: hangoutId,
      sender_id: senderId,
      text,
      media_url: mediaUrl
    });

    if (error) throw error;
  }

  return { messages, loading, sendMessage };
}
