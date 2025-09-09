// src/functions/ThemeStudiesFunctions.js
// Assumindo que você já tem apiUrl definido em algum lugar (ex.: process.env)
const apiUrl = process.env.REACT_APP_API_BASE_URL

export const fetchPendingStudies = async ({ page = 1, limit = 12 } = {}) => {
    console.log("fetching all pending studies")
  try {
    const url = `${apiUrl}/api/adm/themeStudy/allPendingStudies`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data?.message || "Falha ao listar pendentes." };
    return { ok: true, items: data.items || [], total: data.total || 0, page: data.page, pageSize: data.pageSize };
  } catch (e) {
    return { ok: false, message: e?.message || "Erro de rede ao listar pendentes." };
  }
};

export const aproveStudy = async (id, approverId) => {
  try {
    const res = await fetch(`${apiUrl}/api/adm/themeStudy/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ approverId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data?.message || "Falha ao aprovar estudo." };
    return { ok: true, item: data.item };
  } catch (e) {
    return { ok: false, message: e?.message || "Erro de rede ao aprovar estudo." };
  }
};

export const disaproveStudy = async (id, reason = "Rejeitado sem justificativa detalhada.") => {
  try {
    const res = await fetch(`${apiUrl}/api/studies/themeStudy/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data?.message || "Falha ao rejeitar estudo." };
    return { ok: true, item: data.item };
  } catch (e) {
    return { ok: false, message: e?.message || "Erro de rede ao rejeitar estudo." };
  }
};
