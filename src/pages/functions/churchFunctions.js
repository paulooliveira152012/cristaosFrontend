// src/pages/functions/churchFunctions.js
const apiUrl = process.env.REACT_APP_API_BASE_URL;

export const fetchChurchInfo = async (id) => {
  if (!id) throw new Error("fetchChurchInfo: id é obrigatório");
  const url = `${apiUrl}/api/church/getChurchInfo/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(url); // público: sem credentials
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Erro ao buscar igreja:", err);
    throw err;
  }
};

/**
 * Busca membros de uma igreja (público; ajuste credentials se a rota for protegida)
 * Retorna: { members, page, limit, total }
 */
export const fetchChurchMembers = async (
  id,
  { page = 1, limit = 20, status = "active", role, q } = {}
) => {
  if (!id) throw new Error("fetchChurchMembers: id é obrigatório");

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  });
  if (role) params.set("role", role);
  if (q) params.set("q", q);

  const url = `${apiUrl}/api/church/getChurchMembers/${encodeURIComponent(
    id
  )}?${params.toString()}`;

  try {
    const response = await fetch(url /* , { credentials: "include" } */);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json(); // { members, page, limit, total }
    return data;
  } catch (err) {
    console.error("Erro ao buscar membros da igreja:", err);
    throw err;
  }
};

