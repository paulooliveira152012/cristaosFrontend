// utils/http.ts (ou no próprio profilePageFunctions.js)
export const makeAuthHeaders = (mode = "json") => {
  const token = localStorage.getItem("authToken");
  const headers = {};

  if (mode === "json") {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";
  }
  // Para form-data NÃO defina Content-Type manualmente

  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};