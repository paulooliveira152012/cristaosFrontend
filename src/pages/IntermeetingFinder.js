// src/pages/Intermeeting.jsx
import React, { useEffect, useMemo, useState } from "react";

const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

function normalizeMeeting(m) {
  if (!m || typeof m !== "object") return m;
  const id = m._id || m.id;
  const name = m.name || m.title || "Reunião";

  // extrai lat/lng (aceita tanto lat/lng direto quanto GeoJSON Point)
  let { lat, lng } = m;
  if (
    (lat == null || lng == null) &&
    m.location?.coordinates &&
    Array.isArray(m.location.coordinates) &&
    m.location.coordinates.length === 2
  ) {
    const [lng0, lat0] = m.location.coordinates;
    lat = lat ?? lat0;
    lng = lng ?? lng0;
  }

  return {
    ...m,
    _id: id,
    id,
    name,
    title: name,
    lat,
    lng,
    // normaliza meetingDate: ISO string (ou null)
    meetingDate: m.meetingDate
      ? new Date(m.meetingDate).toISOString()
      : null,
  };
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function mapLink({ lat, lng, address }) {
  if (lat != null && lng != null) {
    // rota até as coords
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }
  return null;
}

const Intermeeting = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("upcoming"); // upcoming | past | all
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${baseUrl}/api/intermeeting/intermeetings`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.meetings)
        ? data.meetings
        : [];
      setMeetings(arr.map(normalizeMeeting));
    } catch (e) {
      setErr(e?.message || "Falha ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    let list = meetings.slice();

    // filtro por escopo temporal
    if (scope !== "all") {
      list = list.filter((m) => {
        if (!m.meetingDate) return scope === "past"; // sem data: considere passado
        const t = new Date(m.meetingDate).getTime();
        return scope === "upcoming" ? t >= now : t < now;
      });
    }

    // busca por texto
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        return (
          (m.name || "").toLowerCase().includes(q) ||
          (m.summary || "").toLowerCase().includes(q) ||
          (m.address || "").toLowerCase().includes(q) ||
          (m.website || "").toLowerCase().includes(q)
        );
      });
    }

    // ordenação por data (itens sem data vão pro fim)
    list.sort((a, b) => {
      const ta = a.meetingDate ? new Date(a.meetingDate).getTime() : Infinity;
      const tb = b.meetingDate ? new Date(b.meetingDate).getTime() : Infinity;
      if (ta === tb) return 0;
      return sortDir === "asc" ? ta - tb : tb - ta;
    });

    return list;
  }, [meetings, search, scope, sortDir]);

  return (
    <div style={page}>
      <header style={header}>
        <h2 style={{ margin: 0 }}>Encontros Interdenominacionais</h2>
        <div style={controls}>
          <input
            placeholder="Buscar por nome, resumo, endereço…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />
          <select value={scope} onChange={(e) => setScope(e.target.value)} style={select}>
            <option value="upcoming">Próximos</option>
            <option value="past">Passados</option>
            <option value="all">Todos</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} style={select}>
            <option value="asc">Data ↑</option>
            <option value="desc">Data ↓</option>
          </select>
          <button onClick={load} disabled={loading} style={button}>
            {loading ? "Carregando..." : "Recarregar"}
          </button>
        </div>
      </header>

      {err && (
        <div style={errorBox}>
          <b>Erro:</b> {err}
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <p style={{ opacity: 0.7 }}>Nenhuma reunião encontrada.</p>
      )}

      <div style={grid}>
        {filtered.map((m) => {
          const link = mapLink({ lat: m.lat, lng: m.lng, address: m.address });
          return (
            <article key={m._id || m.id} style={card}>
              <h3 style={{ margin: "0 0 4px" }}>{m.name}</h3>
              <div style={metaRow}>
                <span style={pill}>{formatDate(m.meetingDate)}</span>
                {m.website && (
                  <a
                    href={m.website.startsWith("http") ? m.website : `https://${m.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={linkBtn}
                  >
                    Site
                  </a>
                )}
                {link && (
                  <a href={link} target="_blank" rel="noreferrer" style={linkBtn}>
                    Ver rota
                  </a>
                )}
              </div>
              {m.summary && (
                <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{m.summary}</p>
              )}
              {m.address && (
                <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.8 }}>
                  {m.address}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Intermeeting;

/* ===== estilos inline simples ===== */
const page = { padding: 16, maxWidth: 1000, margin: "0 auto" };
const header = { display: "grid", gap: 8, marginBottom: 12 };
const controls = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const input = { padding: "8px 10px", minWidth: 240, flex: 1, border: "1px solid #ddd", borderRadius: 8 };
const select = { padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" };
const button = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f7f7f7", cursor: "pointer" };
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 12,
};
const card = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};
const metaRow = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const pill = { fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "#f0f4ff", border: "1px solid #d6e2ff" };
const linkBtn = { fontSize: 12, padding: "4px 8px", border: "1px solid #ddd", borderRadius: 999, textDecoration: "none" };
const errorBox = { background: "#fff0f0", border: "1px solid #ffd6d6", padding: 10, borderRadius: 8, marginBottom: 10 };
