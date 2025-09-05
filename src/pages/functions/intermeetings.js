// src/pages/functions/intermeetingFunctions.js
const baseUrl = process.env.REACT_APP_API_BASE_URL;

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
