// Funções para gerenciamento de anúncios (Add, Edit, Delete, View)
import axios from "axios";


const API_URL = process.env.REACT_APP_API_BASE_URL;

// Adicionar anúncio
export const addAd = async ({ adData }) => {
  console.log("adicionando novo anuncio...");
  console.log("apiUrl:", API_URL);

  const formData = new FormData();

  Object.entries(adData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });


  // Agora sim: log completo
  for (let [key, value] of formData.entries()) {
    console.log("formData:", key, value);
  }

  console.log("formData passou?");
  console.log("formData: ok, chamando rota no backend...");

  try {
    const res = await axios.post(`${API_URL}/api/adManagement/add`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.log("error:", err);
  }
};


// Editar anúncio
export const editAd = async (adId, adData) => {
  const formData = new FormData();
  Object.entries(adData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const res = await axios.put(
    `${API_URL}/api/adManagement/edit/${adId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );
  return res.data;
};

// Excluir anúncio
export const deleteAd = async (adId) => {
  const res = await axios.delete(`${API_URL}/api/adManagement/delete/${adId}`, {
    withCredentials: true,
  });
  return res.data;
};

// Listar anúncios
export const getAds = async () => {
  const res = await axios.get(`${API_URL}/api/adManagement/view`, {
    withCredentials: true,
  });
  return res.data;
};
