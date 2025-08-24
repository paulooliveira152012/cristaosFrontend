export const fetchAllAds = async (setAds) => {
    console.log("🥳🥳🥳x🥳🥳🥳 Fetching all ads...");
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    console.log("API Base URL:", process.env.REACT_APP_API_BASE_URL);

  try {
    const response = await fetch(`${baseUrl}/api/adm/admFetchAds`, {
      method: "GET",
    });

    if (!response.ok) {
        console.error("❗️❗️❗️ Failed to fetch ads:", response.statusText);
      throw new Error("Failed to fetch ads");
    }
    const data = await response.json();
    // console.log("Response data:", data);

     // Aqui: já vem um array direto, então:
    setAds(data);

  } catch (error) {
    console.error("Error fetching ads:", error);
  }
}