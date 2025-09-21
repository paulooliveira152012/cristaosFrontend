// src/pages/functions/suggestions.js

// ===== Base URL (NÃO use o mesmo nome em params) =====
export const SUG_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

// ===== Consts úteis (se precisar no front) =====
export const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
];

export const TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "sugestao", label: "Sugestão" },
  { value: "ideia", label: "Outra ideia" },
];

// ===== Helpers =====
export function formatDate(d) {
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

const withHeaders = (headers) => {
  const extra = typeof headers === "function" ? headers() : headers || {};
  return { "Content-Type": "application/json", ...extra };
};

const toQuery = (obj = {}) => {
  const qs = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

// ===== API CALLS =====

// GET /api/suggestions
export async function fetchSuggestions({
  baseUrl = SUG_BASE_URL,
  headers,
  params = {}, // { q, type, status, sort, limit, page }
} = {}) {
  const url = `${baseUrl}/api/suggestions${toQuery(params)}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: withHeaders(headers),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Falha ao carregar sugestões"));
  const data = await res.json();
  return Array.isArray(data) ? data : data?.items || [];
}

// GET /api/suggestions/roadmap
export async function fetchRoadmap({ baseUrl = SUG_BASE_URL, headers } = {}) {
  const res = await fetch(`${baseUrl}/api/suggestions/roadmap`, {
    credentials: "include",
    headers: withHeaders(headers),
  });
  if (!res.ok) return { notes: "" };
  const data = await res.json();
  return { notes: data?.notes || "" };
}

// POST /api/suggestions
// Aceita tanto o simples ({ suggestion, currentUser }) quanto o completo
// ({ type, title, description, severity, currentUser })
export async function handleSubmit(
  payload,
  { baseUrl = SUG_BASE_URL, headers } = {}
) {
  // normaliza o payload simples para o formato completo
  let body = payload;
  if (payload && payload.suggestion && !payload.title && !payload.description) {
    body = {
      type: "ideia",
      title: String(payload.suggestion).slice(0, 80),
      description: String(payload.suggestion),
      severity: undefined,
      currentUser: payload.currentUser, // se o back usar fallback do body
    };
  }

  const res = await fetch(`${baseUrl}/api/suggestions`, {
    method: "POST",
    credentials: "include",
    headers: withHeaders(headers),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Falha ao enviar"));
  return res.json();
}

// PATCH /api/suggestions/:id/status
export async function updateSuggestionStatus({
  baseUrl = SUG_BASE_URL,
  headers,
  id,
  status,
} = {}) {
  const res = await fetch(`${baseUrl}/api/suggestions/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: withHeaders(headers),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Falha ao atualizar status"));
  return res.json();
}

// POST /api/suggestions/:id/vote
export async function voteSuggestion({
  baseUrl = SUG_BASE_URL,
  headers,
  id,
} = {}) {
  const res = await fetch(`${baseUrl}/api/suggestions/${id}/vote`, {
    method: "POST",
    credentials: "include",
    headers: withHeaders(headers),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Falha ao votar"));
  return res.json();
}

// PUT /api/suggestions/roadmap
export async function saveRoadmapNotes({
  baseUrl = SUG_BASE_URL,
  headers,
  notes,
} = {}) {
  const res = await fetch(`${baseUrl}/api/suggestions/roadmap`, {
    method: "PUT",
    credentials: "include",
    headers: withHeaders(headers),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Falha ao salvar notas"));
  return res.json(); // { notes }
}
