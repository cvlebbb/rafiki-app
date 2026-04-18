import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuthStore } from "../../stores/useAuthStore";
import { useChatStore } from "../../stores/useChatStore";
import { useFriendStore } from "../../stores/useFriendStore";
import { useHangoutStore } from "../../stores/useHangoutStore";
import { useToastStore } from "../../stores/useToastStore";
import { fetchUserJoinedCount } from "../../utils/membershipQueries";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuthStore();
  const { userId } = useParams();
  const { friends, pendingRequests, fetchFriends, sendFriendRequest, acceptRequest } = useFriendStore();
  const { fetchMyHangouts, myHangouts } = useHangoutStore();
  const { pushToast } = useToastStore();
  const { fetchUserChats } = useChatStore();

  const [targetProfile, setTargetProfile] = useState(profile);
  const [joinedCount, setJoinedCount] = useState(0);

  const targetId = userId || authUser?.id;
  const isOwnProfile = !userId || userId === authUser?.id;

  useEffect(() => {
    if (!authUser?.id) return;
    fetchFriends(authUser.id);
  }, [authUser?.id, fetchFriends]);

  useEffect(() => {
    if (!targetId || !supabase) return;

    async function load() {
      if (isOwnProfile) {
        setTargetProfile(profile);
      } else {
        const { data } = await supabase.from("profiles").select("*").eq("id", targetId).maybeSingle();
        setTargetProfile(data || null);
      }

      const count = await fetchUserJoinedCount(targetId);
      setJoinedCount(count);

      await fetchMyHangouts(targetId);
    }

    load();
  }, [fetchMyHangouts, isOwnProfile, profile, targetId]);

  const existingFriend = useMemo(() => friends.find((f) => f.id === targetId), [friends, targetId]);
  const pending = useMemo(
    () => pendingRequests.find((item) => item.id === targetId),
    [pendingRequests, targetId]
  );

  async function handleAddFriend() {
    if (!authUser?.id || !targetId) return;
    try {
      await sendFriendRequest(authUser.id, targetId);
      pushToast("Friend request sent.", "🤝");
      fetchFriends(authUser.id);
    } catch (error) {
      pushToast(error.message || "Could not send request.", "⚠");
    }
  }

  async function handleAccept() {
    if (!pending?.friendship_id || !authUser?.id) return;
    try {
      await acceptRequest(pending.friendship_id);
      pushToast("Friend request accepted.", "✅");
      fetchFriends(authUser.id);
    } catch (error) {
      pushToast(error.message || "Could not accept request.", "⚠");
    }
  }

  async function handleMessageFriend() {
    if (!authUser?.id) return;
    await fetchUserChats(authUser.id);
    navigate("/app/chats");
    pushToast("Opening chats...", "💬");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#1d1d1d] bg-gradient-to-r from-[#0f2519] via-[#291126] to-[#2f240d] p-6">
        <div className="landing-grid-bg absolute inset-0 opacity-30" />
        <div className="relative pt-16">
          <div className="-mt-24 inline-grid h-28 w-28 place-items-center rounded-3xl border-4 border-black bg-[#141414] text-3xl font-black text-[var(--neon-green)]">
            {(targetProfile?.username || "R").slice(0, 2).toUpperCase()}
          </div>
          <h1 className="mt-3 font-display text-4xl text-white">{targetProfile?.full_name || "Unknown User"}</h1>
          <p className="text-sm text-[#b9b9b9]">@{targetProfile?.username || "unknown"}</p>
          <p className="mt-2 max-w-2xl text-[#d2d2d2]">{targetProfile?.bio || "No bio yet."}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Hangouts Created</p><p className="text-2xl font-bold text-white">{myHangouts.length}</p></div>
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Friends</p><p className="text-2xl font-bold text-white">{friends.length}</p></div>
            <div className="input-shell"><p className="text-xs text-[#8f8f8f]">Hangouts Joined</p><p className="text-2xl font-bold text-white">{joinedCount}</p></div>
          </div>

          {!isOwnProfile && (
            <div className="mt-4 flex gap-2">
              {!existingFriend && !pending && (
                <button type="button" className="btn-primary px-5 py-2" onClick={handleAddFriend}>Add Friend</button>
              )}
              {!existingFriend && pending && !pending.requested_by_me && (
                <button type="button" className="btn-primary px-5 py-2" onClick={handleAccept}>Accept</button>
              )}
              {!existingFriend && pending && pending.requested_by_me && (
                <button type="button" className="btn-outline px-5 py-2" disabled>Request Sent</button>
              )}
              {existingFriend && (
                <>
                  <button type="button" className="btn-outline px-5 py-2" disabled>Friends ✓</button>
                  <button type="button" className="btn-primary px-5 py-2" onClick={handleMessageFriend}>Message</button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-title text-2xl text-white">Friends</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <article key={friend.id} className="rafiki-card p-4" onClick={() => navigate(`/app/profile/${friend.id}`)}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(0,200,81,0.35)] bg-[#191919] font-bold text-[var(--bold-green)]">
                  {(friend.username || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{friend.full_name || friend.username}</p>
                  <p className="text-xs text-[#949494]">Mutual hangouts: --</p>
                </div>
              </div>
              <button type="button" className="btn-outline mt-4 w-full py-2" onClick={(e) => { e.stopPropagation(); handleMessageFriend(); }}>Message</button>
            </article>
          ))}

          <article className="grid place-items-center rounded-[20px] border border-dashed border-[rgba(0,200,81,0.45)] bg-[#121212] p-4 text-center">
            <p className="text-sm font-bold text-[var(--bold-green)]">+ Add Friends</p>
            <p className="mt-1 text-xs text-[#8b8b8b]">Bring your people in.</p>
          </article>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-title text-2xl text-white">Hangouts Created</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myHangouts.map((hangout) => (
            <article key={hangout.id} className="rafiki-card p-4">
              <p className="font-display text-lg text-white">{hangout.title}</p>
              <p className="mt-1 text-xs text-[#9a9a9a]">{hangout.date} · {hangout.time}</p>
            </article>
          ))}
          {myHangouts.length === 0 && (
            <p className="text-sm text-[#8a8a8a]">No created hangouts yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
