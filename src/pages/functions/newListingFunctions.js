// utils/videoUploader.js
export const uploadReelToBackend = async (formData) => {
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/videos/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erro ao enviar vídeo.");
  return data; // { videoUrl: ..., thumbnailUrl: ... }
};
