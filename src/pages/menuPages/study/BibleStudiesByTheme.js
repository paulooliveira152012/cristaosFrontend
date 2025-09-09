// src/pages/BibleStudiesByTheme.jsx
import React, { useMemo, useState, useEffect } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useNavigate } from "react-router-dom";
import { listThemeStudiesPublic } from "../../functions/ThemeStudiesFunctions";
import "../../../styles/Study.css";

// ====== UI ======
const ThemeCard = ({ item, query = "" }) => {
  const navigate = useNavigate();

  // destaque no título ao buscar
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mark = (text) => {
    if (!query) return text;
    const parts = String(text || "").split(
      new RegExp(`(${escapeRegExp(query)})`, "ig")
    );
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
    );
  };

  const goToStudy = () => navigate(`/themeStudy/${item._id}`);

  return (
    <button
      className="card card--clickable"
      onClick={goToStudy}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goToStudy()}
      aria-label={`Abrir estudo: ${item.title}`}
    >
      <h3 className="cardTitle">{mark(item.title)}</h3>
      <p className="cardMeta">
        Tema: <strong>{item.theme}</strong>
        {item.author?.username ? <> · por <strong>@{item.author.username}</strong></> : null}
      </p>
      {/* Nada de conteúdo/preview aqui — só título/metadados */}
    </button>
  );
};

// ====== Página ======
const BibleStudiesByTheme = () => {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [theme, setTheme] = useState(""); // vazio = todos
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setErr("");

    const t = setTimeout(async () => {
      try {
        const out = await listThemeStudiesPublic({
          theme: theme || undefined,
          q: q.trim() || undefined,
          page,
          limit,
          sort: "new",
        });
        if (stop) return;
        if (!out?.ok) throw new Error(out?.message || "Falha ao carregar estudos.");
        setItems(out.items || []);
        setTotal(out.total || 0);
      } catch (e) {
        if (!stop) setErr(e?.message || "Erro ao carregar estudos.");
      } finally {
        if (!stop) setLoading(false);
      }
    }, 350);

    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [q, theme, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [q, theme]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  return (
    <>
      <Header showProfileImage={false} navigate={navigate} />
      <div className="landingListingsContainer studyPage">
        <div className="container">
          <h1 style={{ margin: "8px 0 4px" }}>Estudos por Temas</h1>
          <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
            Explore estudos bíblicos aprovados, organizados por temas.
          </p>

          <div className="toolbar">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="select"
              aria-label="Filtrar tema"
            >
              <option value="">Todos os temas</option>
              <option value="theology">Theology</option>
              <option value="doctrinary">Doctrinary</option>
              <option value="ecclesiastical">Ecclesiastical</option>
              <option value="pastoral">Pastoral</option>
              <option value="ethics">Ethics</option>
              <option value="missions">Missions</option>
            </select>

            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título..."
              className="input"
            />
            {q && (
              <button
                className="clearBtn"
                onClick={() => setQ("")}
                aria-label="Limpar busca"
              >
                Limpar
              </button>
            )}
          </div>

          {loading && <div>Carregando…</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}

          {!loading && !err && (
            <>
              {items.length === 0 ? (
                <div style={{ opacity: 0.8, fontStyle: "italic" }}>
                  Nenhum resultado para <strong>{q || "—"}</strong>
                  {theme ? <> em <strong>{theme}</strong></> : null}.
                </div>
              ) : (
                <div className="grid">
                  {items.map((it) => (
                    <ThemeCard key={it._id} item={it} query={q} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BibleStudiesByTheme;
