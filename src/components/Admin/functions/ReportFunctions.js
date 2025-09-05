const apiUrl = process.env.REACT_APP_API_BASE_URL;

export const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchAllReports(currentUser) {
  const isLeader = currentUser?.leader || currentUser?.role === "leader";
  if (!isLeader) throw new Error("Acesso negado.");

  const res = await fetch(`${apiUrl}/api/adm/getAllReports`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...authHeaders(),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar reports (HTTP ${res.status}) ${txt}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Resposta não-JSON do servidor: ${txt || "(vazia)"}`);
  }

  return res.json(); // esperado { ok: true, items: [...] }
}

/**
 * Atualiza status do report
 * status: "open" | "resolved" | "dismissed"
 * note: string opcional
 */
export async function updateReportStatus(reportId, status, note) {
  const res = await fetch(`${apiUrl}/api/adm/reports/${reportId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status, note }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao atualizar report (HTTP ${res.status}) ${txt}`);
  }
  return res.json(); // esperado { ok: true, item: {...} }
}
