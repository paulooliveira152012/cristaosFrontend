const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

/** Normaliza um doc vindo do back para o formato usado na UI */
function normalizeMeeting(doc) {
  // pode vir como { ... , location: { type:'Point', coordinates:[lng,lat] } }
  let lng = doc.lng;
  let lat = doc.lat;

  if (
    (lng === undefined || lat === undefined) &&
    doc.location?.type === "Point" &&
    Array.isArray(doc.location.coordinates) &&
    doc.location.coordinates.length === 2
  ) {
    lng = doc.location.coordinates[0];
    lat = doc.location.coordinates[1];
  }

  // coagir para número (o MeetingList testa typeof === 'number')
  const nLng = Number(lng);
  const nLat = Number(lat);

  return {
    _id: doc._id || doc.id,
    name: doc.name || doc.title || "Sem título",
    summary: doc.summary || doc.description || "",
    address: doc.address || "",
    website: doc.website || "",
    meetingDate: doc.meetingDate || null,
    lng: Number.isFinite(nLng) ? nLng : undefined,
    lat: Number.isFinite(nLat) ? nLat : undefined,
    // preserva location original caso precise
    location: doc.location,
  };
}

export const getMeetings = async () => {
  console.log("fetching meetings...")
  const res = await fetch(`${baseUrl}/api/intermeeting/intermeetings`, { method: "GET" });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Falha ao carregar reuniões (HTTP ${res.status}) ${msg}`);
  }
  const data = await res.json();

  console.log("reunioes:", data)

  // Aceita tanto { meetings: [...] } quanto [...] direto
  const arr = Array.isArray(data) ? data : Array.isArray(data.meetings) ? data.meetings : [];
  return arr.map(normalizeMeeting);
};



/** Converte o form do componente para o formato esperado pelo backend */
/** Converte o form do MeetingForm no payload que o back espera */
function toApiPayload(form) {
  const out = {
    name: (form.name ?? form.title ?? "").trim(),
    summary: (form.summary ?? form.description ?? "").trim(),
    address: (form.address ?? "").trim(),
    website: (form.website ?? "").trim(),
    meetingDate: form.meetingDate
      ? new Date(form.meetingDate).toISOString()
      : undefined,
  };

  // Lembre: o form guarda strings; convertemos para Number
  const lng = Number(form.lng);
  const lat = Number(form.lat);

  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    // Envie nos dois formatos: facilita o back e mantém compatibilidade
    out.location = { type: "Point", coordinates: [lng, lat] }; // [lng, lat]
    out.lng = lng;
    out.lat = lat;
  }

  return out;
}

export async function createMeeting(form) {
  const body = toApiPayload(form);

  if (!body.name) throw new Error("Nome é obrigatório.");
  if (!body.location) throw new Error("Longitude/latitude inválidas.");

  const res = await fetch(`${baseUrl}/api/intermeeting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Falha ao criar reunião (${res.status})`);
  }

  const created = await res.json();
  return normalizeMeeting(created);
}

export async function updateMeeting(id, form) {
  console.log("updating meeting...")
  const body = toApiPayload(form);
  console.log("form:", form)
  if (!body.name) throw new Error("Nome é obrigatório.");
  if (!body.location) throw new Error("Longitude/latitude inválidas.");

  const res = await fetch(`${baseUrl}/api/intermeeting/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Falha ao atualizar reunião (${res.status})`);
  }

  const updated = await res.json();
  return normalizeMeeting(updated);
}

export async function deleteMeeting(id) {
  const res = await fetch(`${baseUrl}/api/intermeeting/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Falha ao excluir reunião (${res.status})`);
  }
  return res.json(); // { ok: true }
}
