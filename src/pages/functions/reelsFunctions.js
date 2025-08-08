export const handleSubmitComment = async ({ reelId, userId, text }, { timeout = 12000 } = {}) => {
    console.log(`${userId} submiting "${text}" to reel ${reelId}`)
    
  const API_URL = process.env.REACT_APP_API_BASE_URL;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);


  const res = await fetch(`${API_URL}/api/reels/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reelId, userId, text }),
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Erro ao enviar comentário: ${res.status} ${res.statusText} ${msg}`);
  }
  const txt = await res.text().catch(() => "");
  return txt ? JSON.parse(txt) : null;
};
