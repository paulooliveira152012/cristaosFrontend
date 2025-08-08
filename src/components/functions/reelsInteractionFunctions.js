// utils/reelActions.js
const API_URL = process.env.REACT_APP_API_BASE_URL;

// helper
async function postJSON(path, body) {
    
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

// ---------------- Like ----------------
export async function likeAction({ reelId, userId }) {
  // { liked: boolean, likesCount?: number }
  return postJSON(`/api/reels/like`, { reelId, userId });
}

// ---------------- Save ----------------
export async function saveAction({ reelId, userId }) {
  // { saved: boolean }
  return postJSON(`/api/reels/save`, { reelId, userId });
}

// ---------------- Comments ----------------
// If you just need to LOAD comments but still send userId in the body,
// use a "list" endpoint with POST. Adjust path to your backend.
export async function commentAction({ reelId, userId, text }) {
  if (text && text.trim()) {
    // Create a comment
    return postJSON(`/api/reels/comments`, { reelId, userId, text: text.trim() });
  }
  // List comments
  return postJSON(`/api/reels/comments/list`, { reelId, userId });
  // expected: { comments: [...] } or [...]
}

// ---------------- Share ----------------
export async function shareAction({ reelId, userId, url }) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  // register share server-side (includes userId)
  try {
    await postJSON(`/api/reels/share`, { reelId, userId, url: shareUrl });
  } catch (e) {
    console.warn("share register failed:", e?.message || e);
  }

  // local share UX
  try {
    if (navigator.share) {
      await navigator.share({ title: "Veja este reel", url: shareUrl });
      return { ok: true, method: "webshare" };
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return { ok: true, method: "clipboard" };
    }
  } catch (e) {
    console.warn("local share failed:", e?.message || e);
  }
  return { ok: false, method: "none" };
}
