// components/meetings/meetingApi.js
const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

// MeetingsFunctions.js

export const getMeetings = async () => {
  console.log("fetching meetings...");
  const res = await fetch(`${baseUrl}/api/intermeeting`, {
    method: "GET",
    // credentials: "include", // ative se sua API usa cookie auth
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Falha ao carregar reuniões (HTTP ${res.status}) ${msg}`);
  }

  const data = await res.json(); // { meetings: [...] }
  console.log("data:", data);
  return Array.isArray(data.meetings) ? data.meetings : [];
};

export function fcToArray(fc) {
  if (!fc || !Array.isArray(fc.features)) return [];
  return fc.features.map((f) => {
    const [lng, lat] = f.geometry?.coordinates || [];
    const p = f.properties || {};
    return {
      _id: p.id,
      name: p.title,
      summary: p.description,
      address: p.address,
      website: p.website,
      meetingDate: p.meetingDate, // ISO string (converta no formulário se precisar)
      url: p.url,
      lng,
      lat,
    };
  });
}



export async function createMeeting(form) {
  console.log("criando um intermeeting");
  console.log("form recebido:", form);
  console.log("baseUrl:", baseUrl);

  // Mapeia exatamente como o schema espera
  const body = {
    name: (form.name ?? form.title ?? "").trim(),                 // fallback para title
    summary: (form.summary ?? form.description ?? "").trim(),
    address: (form.address ?? "").trim(),
    website: (form.website ?? "").trim(),
    meetingDate: form.meetingDate ? new Date(form.meetingDate).toISOString() : undefined,
    location: {
      type: "Point",
      coordinates: [Number(form.lng), Number(form.lat)],          // [lng, lat]
    },
  };

  // Validações rápidas no cliente (opcional mas útil)
  if (!body.name) throw new Error("Nome é obrigatório.");
  if (!Number.isFinite(body.location.coordinates[0]) || !Number.isFinite(body.location.coordinates[1])) {
    throw new Error("Longitude/latitude inválidas.");
  }

  const res = await fetch(`${baseUrl}/api/intermeeting/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("ERRO API createMeeting:", res.status, text);
    throw new Error(text || `Falha ao criar reunião (${res.status})`);
  }

  // Backend retorna o doc direto
  return res.json();
}


export async function updateMeeting(id, payload) {
  const res = await fetch(`${baseUrl}/api/meetings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("ERRO API createMeeting:", res.status, text);
    throw new Error(text || `Falha ao criar reunião (${res.status})`);
  }
  return res.json(); // o backend devolve o doc direto
}

export async function deleteMeeting(id) {
  const res = await fetch(`${baseUrl}/api/meetings/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Falha ao excluir reunião");
  return res.json(); // { ok: true }
}
