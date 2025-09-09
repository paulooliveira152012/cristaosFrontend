// src/functions/themeStudyFunctions.js
const apiUrl = process.env.REACT_APP_API_BASE_URL;

// Pega o token salvo pelo seu login
const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper de fetch -> JSON com tratamento de erro padronizado
async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = data?.message || `Falha na requisição. (HTTP ${res.status})`;
    return { ok: false, message: msg, status: res.status, data };
  }
  return data; // esperado: { ok:true, item } ou { ok:true, items, total, ... }
}

/**
 * POST /api/studies/themeStudy
 * body: { title, theme, content, image? }
 */
export const createThemeStudy = async ({ title, theme, content, image }) => {
  const res = await fetch(`${apiUrl}/api/studies/themeStudy`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ title, theme, content, image }),
  });
  return toJson(res); // -> { ok:true, item }
};

/**
 * GET /api/studies/themeStudy/mine/list
 * query: ?status=pending|approved|rejected&theme=&q=&page=&limit=
 */
export const listMyThemeStudies = async (opts = {}) => {
  const qs = new URLSearchParams();
  if (opts.status) qs.set("status", opts.status);
  if (opts.theme) qs.set("theme", opts.theme);
  if (opts.q) qs.set("q", opts.q);
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));

  const url = `${apiUrl}/api/studies/themeStudy/mine/list${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res); // -> { ok:true, items, total, page, pageSize }
};

/**
 * GET /api/studies/themeStudy/mod/list  (líder)
 * query: ?status=pending|approved|rejected&theme=&q=&page=&limit=
 */
export const listThemeStudiesForMod = async (opts = {}) => {
  const qs = new URLSearchParams();
  if (opts.status) qs.set("status", opts.status);
  if (opts.theme) qs.set("theme", opts.theme);
  if (opts.q) qs.set("q", opts.q);
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));

  const url = `${apiUrl}/api/studies/themeStudy/mod/list${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res); // -> { ok:true, items, total, page, pageSize }
};

/**
 * PUT /api/studies/themeStudy/:id
 * body: { title?, theme?, content?, image? }
 * (se autor editar um approved, volta a pending no backend)
 */
export const updateThemeStudy = async (id, payload) => {
  const res = await fetch(`${apiUrl}/api/studies/themeStudy/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload || {}),
  });
  return toJson(res); // -> { ok:true, item }
};

/**
 * PUT /api/studies/themeStudy/:id/approve  (líder)
 * body opcional: { publishedAt }
 */
export const approveThemeStudy = async (id, publishedAt) => {
  const res = await fetch(`${apiUrl}/api/studies/themeStudy/${id}/approve`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(
      publishedAt ? { publishedAt: new Date(publishedAt).toISOString() } : {}
    ),
  });
  return toJson(res); // -> { ok:true, item }
};

/**
 * PUT /api/studies/themeStudy/:id/reject  (líder)
 * body: { reason? }
 */
export const rejectThemeStudy = async (id, reason) => {
  const res = await fetch(`${apiUrl}/api/studies/themeStudy/${id}/reject`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return toJson(res); // -> { ok:true, item }
};

/**
 * DELETE /api/studies/themeStudy/:id
 * (autor ou líder)
 */
export const deleteThemeStudy = async (id) => {
  const res = await fetch(`${apiUrl}/api/studies/themeStudy/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res); // -> { ok:true }
};

// LISTA PÚBLICA (sem token/cookies)
// GET /api/studies/themeStudy/public/list?theme=&q=&page=&limit=&sort=new|old
export const listThemeStudiesPublic = async ({opts = {}}) => {
  const qs = new URLSearchParams();
  if (opts.theme) qs.set("theme", opts.theme);        // ex.: "theology"
  if (opts.q) qs.set("q", opts.q);                    // busca full-text
  if (opts.page) qs.set("page", String(opts.page));   // default 1
  if (opts.limit) qs.set("limit", String(opts.limit)); // default 10
  if (opts.sort) qs.set("sort", opts.sort);           // "new" | "old"

  const url = `${apiUrl}/api/studies/themeStudy/public/list`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit", // público
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    return {
      ok: false,
      message: data?.message || `Falha ao carregar. (HTTP ${res.status})`,
      status: res.status,
    };
  } 
  return data; // { ok:true, items, total, page, pageSize }
};

// src/functions/ThemeStudiesFunctions.js
// src/functions/ThemeStudiesFunctions.js
export async function getThemeStudyPublic(id) {
  console.log("buscando estudo...", id);
  try {
    const url = `${apiUrl}/api/studies/themeStudy/id/${id}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("getThemeStudyPublic error:", res.status, data);
      return { ok: false, message: data?.message || "Erro ao buscar estudo." };
    }

    return { ok: true, item: data?.item || data };
  } catch (e) {
    return { ok: false, message: e?.message || "Falha de rede ao buscar estudo." };
  }
}


