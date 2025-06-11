// src/utils/api.js
const baseURL = process.env.REACT_APP_API_BASE_URL;

export const getItems = async () => {
  try {
    const response = await fetch(`${baseURL}/api/getItems`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
};
