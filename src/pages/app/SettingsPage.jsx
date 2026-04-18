import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useToastStore } from "../../stores/useToastStore";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, signOut, updateProfile } = useAuthStore();
  const { pushToast } = useToastStore();

  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    try {
      setSaving(true);
      await updateProfile({ username, bio, avatarFile });
      pushToast("Profile updated.", "✅");
      navigate("/app/profile");
    } catch (error) {
      pushToast(error.message || "Could not update profile.", "⚠");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      pushToast("Signed out.", "👋");
      navigate("/login", { replace: true });
    } catch (error) {
      pushToast(error.message || "Could not sign out.", "⚠");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6">
      <section className="rounded-3xl border border-[#1d1d1d] bg-[#111] p-5">
        <h2 className="font-title text-3xl text-white">Settings</h2>
        <p className="mt-1 text-sm text-[#8e8e8e]">Update username, bio, profile picture, and sign out.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <div className="flex items-center gap-4">
            <img
              src={avatarPreview || "https://placehold.co/96x96?text=R"}
              alt="avatar preview"
              className="h-20 w-20 rounded-full border border-[rgba(0,200,81,0.5)] object-cover"
            />
            <label className="btn-outline cursor-pointer px-4 py-2 text-xs">
              Change picture
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setAvatarPreview(String(reader.result || ""));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">Username</label>
            <input className="input-shell" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8f8f8f]">Bio</label>
            <textarea className="input-shell h-24 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people your vibe..." />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="submit" className="btn-primary py-3" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className="btn-magenta py-3" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
