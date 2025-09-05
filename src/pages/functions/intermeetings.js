// src/pages/functions/intermeetingFunctions.js
const baseUrl = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchMeetingInfo(id) {
  if (!id) throw new Error("ID da reunião ausente.");
  const res = await fetch(`${baseUrl}/api/intermeeting/intermeetings/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Falha ao carregar reunião (HTTP ${res.status}) ${msg}`);
  }
  const data = await res.json();
  return data.item || data; // suporta { ok, item } ou objeto direto
}

export async function fetchMeetingAttendees(id, { limit = 30 } = {}) {
  const res = await fetch(
    `${baseUrl}/api/intermeeting/${id}/attendees?limit=${limit}`,
    { credentials: "include", headers: { ...authHeaders(), Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok, count, imGoing, items: [{_id,username,profileImage}] }
}

export async function rsvpMeeting(id, going) {
  const res = await fetch(`${baseUrl}/api/intermeeting/${id}/rsvp`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ going }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok, going, count }
}
