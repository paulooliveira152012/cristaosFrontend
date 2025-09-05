// utils/AuthHeaders.js
export const authHeaders = (options = { json: true }) => {
  const token = localStorage.getItem("authToken");

  // Por padrão, preparamos headers para JSON
  const headers = options.json
    ? { Accept: "application/json", "Content-Type": "application/json" }
    : {}; // quando for FormData, não defina Content-Type manualmente

  if (token) {
    headers.Authorization = `Bearer ${token}`; // <— prefixo precisa ser "Bearer "
  }
  return headers;
};
