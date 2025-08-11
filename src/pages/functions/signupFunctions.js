const apiUrl = process.env.REACT_APP_API_BASE_URL

// fetch all churches
export const fetchAllChurches = async (setChurches) => {
    console.log("🥳🥳🥳🥳🥳🥳 fetching churches...")
  try {
    const res = await fetch(`${apiUrl}/api/church`, {
      method: "GET",
      credentials: "include", // se precisar enviar cookies de sessão
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar igrejas: ${res.status}`);
    }

    const data = await res.json();
    console.log("fetched churches:", data)

    setChurches(data)
    return data; // array de igrejas
  } catch (err) {
    console.error("❌ Erro ao buscar igrejas:", err);
    return [];
  }
};
