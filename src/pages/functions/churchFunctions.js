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
