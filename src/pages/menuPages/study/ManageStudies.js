// src/pages/profile/MyThemeStudies.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
// ajuste o caminho conforme seu projeto:
// import { listMyThemeStudies } from "../../functions/themeStudyFunctions";
import { listMyThemeStudies } from "../../functions/ThemeStudiesFunctions";
import "../../../styles/Study.css";

const THEME_OPTIONS = [
  { value: "", label: "Todos os temas" },
  { value: "theology", label: "Theology" },
  { value: "apologetics", label: "Apologetics" },
  { value: "historic", label: "Historic" },
  { value: "ecclesiastical", label: "Ecclesiastical" },
  { value: "doctrinary", label: "Doctrinary" },
  { value: "pastoral", label: "Pastoral" },
  { value: "devotional", label: "Devotional" },
  { value: "missions", label: "Missions" },
  { value: "ethics", label: "Ethics" },
  { value: "hermeneutics", label: "Hermeneutics" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
];

const STATUS_BADGE_STYLE = {
  pending: { background: "#fff3cd", color: "#7a5d00", border: "1px solid #ffe69c" },
  approved: { background: "#e6f4ea", color: "#1e4620", border: "1px solid #b7e1c2" },
  rejected: { background: "#fde8e7", color: "#7a1a16", border: "1px solid #f5c2c0" },
};

const StudyRow = ({ item, onOpen }) => {
  const statusStyle = STATUS_BADGE_STYLE[item.status] || {};
  return (
    <button
      className="card card--clickable"
      onClick={() => onOpen(item._id)}
      aria-label={`Abrir estudo: ${item.title}`}
      style={{ textAlign: "left" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="cardTitle" style={{ marginBottom: 6 }}>{item.title}</h3>
          <p className="cardMeta" style={{ marginBottom: 6 }}>
            Tema: <strong>{item.theme}</strong>
            {item.author?.username ? <> · por <strong>@{item.author.username}</strong></> : null}
            {item.publishedAt ? <> · publicado em {new Date(item.publishedAt).toLocaleDateString()}</> : null}
          </p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            padding: "4px 8px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            ...statusStyle,
          }}
        >
          {item.status === "pending" ? "Pendente" : item.status === "approved" ? "Aprovado" : "Rejeitado"}
        </span>
      </div>
      {item.status === "rejected" && item.rejectionReason && (
        <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
          Motivo da rejeição: <em>{item.rejectionReason}</em>
        </p>
      )}
    </button>
  );
};

const ManageStudies = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // filtros
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // dados
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // ui state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // carregar lista (debounce em q)
  useEffect(() => {
    let stop = false;
    setLoading(true);
    setErr("");

    const t = setTimeout(async () => {
      try {
        const out = await listMyThemeStudies({
          status: status || undefined,
          theme: theme || undefined,
          q: q.trim() || undefined,
          page,
          limit,
        });
        if (stop) return;
        if (!out?.ok) throw new Error(out?.message || "Falha ao carregar seus estudos.");
        setItems(out.items || []);
        setTotal(out.total || 0);
      } catch (e) {
        if (!stop) setErr(e?.message || "Erro ao carregar seus estudos.");
      } finally {
        if (!stop) setLoading(false);
      }
    }, 350);

    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [q, theme, status, page, limit]);

  // reset página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [q, theme, status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const openStudy = (id) => {
    // abre página pública de estudo aprovado (ou sua rota interna de edição caso tenha)
    navigate(`/themeStudy/${id}`);
  };

  return (
    <>
      <Header showProfileImage={false} navigate={navigate} />
      <div className="landingListingsContainer studyPage">
        <div className="container">
          <h1 style={{ margin: "8px 0 4px" }}>Meus Estudos por Tema</h1>
          <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
            Aqui você vê todos os estudos que você enviou (pendentes, aprovados e rejeitados).
          </p>

          {/* Alerta simples se a URL tiver outro userId (opcional) */}
          {userId && (
            <div style={{ margin: "6px 0 14px", fontSize: 13, opacity: 0.75 }}>
              Exibindo estudos do usuário logado. O parâmetro <code>:userId</code> na URL é ignorado nesta lista.
            </div>
          )}
          

          <div className="toolbar" style={{ gap: 8 }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select"
              aria-label="Filtrar status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="select"
              aria-label="Filtrar tema"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título ou conteúdo..."
              className="input"
            />
            {(q || theme || status) && (
              <button
                className="clearBtn"
                onClick={() => { setQ(""); setTheme(""); setStatus(""); }}
                aria-label="Limpar filtros"
              >
                Limpar
              </button>
            )}
          </div>

          <button onClick={() => navigate("/newStudy")}>Enviar novo estudo</button>

          {loading && <div>Carregando…</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}

          {!loading && !err && (
            <>
              {items.length === 0 ? (
                <div style={{ opacity: 0.8, fontStyle: "italic" }}>
                  Nenhum estudo encontrado para seus filtros.
                </div>
              ) : (
                <div className="grid">
                  {items.map((it) => (
                    <StudyRow key={it._id} item={it} onOpen={openStudy} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Anterior
                  </button>
                  <span> Página {page} de {totalPages} </span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageStudies;
