// src/pages/functions/studyFunctions.js
const apiUrl = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// lista capítulos do livro + marca os que já têm estudo
export async function fetchBookChapters(bookId) {
  const res = await fetch(`${apiUrl}/api/studies/${bookId}/chapters`, {
    credentials: "include",
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok:true, items:[{chapter, hasStudy}], total }
}

// pega o estudo de um capítulo
export async function fetchStudyByChapter(bookId, chapter) {
  console.log(`buscando estudo de ${bookId} capitulo ${chapter} `)
  console.log("apiUrl:", apiUrl)
  const res = await fetch(`${apiUrl}/api/studies/${bookId}/${chapter}`, {
    credentials: "include",
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  if (res.status === 404) return { ok: true, item: null };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok:true, item:{...} }
}

// cria/atualiza estudo (líder)
export async function upsertStudy({ bookId, chapter, title, content, author }) {
  const res = await fetch(`${apiUrl}/api/studies`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ 
      bookId, 
      chapter, 
      title, 
      content,
      author
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok:true, item:{...} }
}

// excluir estudo (líder)
export async function deleteStudy(id) {
  const res = await fetch(`${apiUrl}/api/studies/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok:true }
}
