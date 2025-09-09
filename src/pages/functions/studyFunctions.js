// src/pages/functions/studyFunctions.js
const apiUrl = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// lista capítulos do livro + marca os que já têm estudo
export async function fetchBookChapters(bookId) {
  const res = await fetch(`${apiUrl}/api/studies/${bookId}/chapters`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit", // público
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


// pega o estudo de um capítulo
// src/functions/studyFunctions.js
export async function fetchStudyByChapter(bookId, chapter, opts = {}) {
  const qs = new URLSearchParams();
  if (opts.author) qs.set("author", opts.author); // opcional p/ líderes
  const url = `${apiUrl}/api/studies/${bookId}/${chapter}${
    qs.toString() ? `?${qs}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit", // <- público
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    return {
      ok: false,
      message: data?.message || `Falha ao carregar. (${res.status})`,
    };
  }
  return { ok: true, item: data.item };
}

// cria/atualiza estudo (líder)
export async function upsertStudy({ bookId, chapter, title, content, author }) {
  const res = await fetch(`${apiUrl}/api/studies`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(typeof authHeaders === "function" ? authHeaders() : {}),
      Accept: "application/json",
    },
    credentials: "include", // protegido
    body: JSON.stringify({ bookId, chapter, title, content, author }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


export async function updateStudy(payload) {
  // payload: { bookId, chapter, title, content }
  const { bookId, chapter, title, content, author } = payload;
  console.log(
    "✅ bookId:",
    bookId,
    "✅ chapter:",
    chapter,
    "✅ title:",
    title,
    "✅ content:",
    content,
    "✅ author:",
    author
  );

  try {
    const res = await fetch(`${apiUrl}/api/studies/${bookId}/${chapter}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(typeof authHeaders === "function" ? authHeaders() : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        title,
        content
      }), // não envie author aqui se o server usa req.user
    });

    // tenta ler JSON, mas evita quebrar em 204 etc
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      // Ex.: 401 → pedir login
      const msg = data?.message || `Falha ao salvar estudo. (${res.status})`;
      return { ok: false, message: msg, status: res.status };
    }

    return { ok: true, item: data.item };
  } catch (e) {
    return { ok: false, message: e?.message || "Erro ao salvar estudo." };
  }
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


export const listMyThemeStudies = () => {
  console.log("listando estudo...")
}