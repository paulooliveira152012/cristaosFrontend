// src/pages/admin/PendingStudies.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchPendingStudies, aproveStudy, disaproveStudy } from "./functions/StudiesFunctions";
import { useUser } from "../../context/UserContext"; // se já tiver esse contexto
// import Header / Footer se quiser manter layout padrão
// import Header from "../../../components/Header";
// import Footer from "../../../components/Footer";

export const PendingStudies = () => {
  const { currentUser } = useUser?.() || { currentUser: null }; // opcional, caso não tenha contexto
  const approverId = currentUser?._id;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [expanded, setExpanded] = useState({}); // { [id]: boolean } - abre/fecha conteúdo
  const [reasons, setReasons] = useState({});   // { [id]: string } - motivo de rejeição
  const [busyId, setBusyId] = useState(null);   // ID em processamento (approve/reject)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const out = await fetchPendingStudies({ page, limit });
      if (!out?.ok) throw new Error(out?.message || "Falha ao carregar pendentes.");
      setItems(out.items || []);
      setTotal(out.total || 0);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar pendentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleApprove = async (id) => {
    if (!approverId) {
      alert("Você precisa estar logado como gestor para aprovar.");
      return;
    }
    if (!window.confirm("Aprovar este estudo?")) return;

    setBusyId(id);
    try {
      // otimista: remove da lista já
      setItems((prev) => prev.filter((x) => x._id !== id));
      const out = await aproveStudy(id, approverId);
      if (!out?.ok) {
        // rollback se falhar
        await load();
        alert(out?.message || "Falha ao aprovar estudo.");
        return;
      }
      // sucesso: opcional mostrar toast/alert
    } catch (e) {
      await load();
      alert(e?.message || "Erro ao aprovar estudo.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = (reasons[id] || "").trim();
    if (!reason) {
      alert("Informe um motivo breve para a rejeição.");
      return;
    }
    if (!window.confirm("Rejeitar este estudo?")) return;

    setBusyId(id);
    try {
      // otimista: remove da lista já
      setItems((prev) => prev.filter((x) => x._id !== id));
      const out = await disaproveStudy(id, reason);
      if (!out?.ok) {
        await load();
        alert(out?.message || "Falha ao rejeitar estudo.");
        return;
      }
      // sucesso
      setReasons((r) => {
        const copy = { ...r };
        delete copy[id];
        return copy;
      });
    } catch (e) {
      await load();
      alert(e?.message || "Erro ao rejeitar estudo.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* <Header />  se quiser manter layout global */}
      <div className="landingListingsContainer studyPage">
        <div className="container" style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
          <h1 style={{ margin: "8px 0 4px" }}>Revisão de Estudos Pendentes</h1>
          <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
            Aprove ou rejeite estudos enviados pelos membros.
          </p>

          <div className="toolbar" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <button className="clearBtn" onClick={load} disabled={loading} style={{ padding: "8px 12px" }}>
              Atualizar
            </button>
            <span style={{ opacity: 0.8 }}>
              Total pendentes: <strong>{total}</strong>
            </span>
          </div>

          {loading && <div>Carregando…</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}

          {!loading && !err && items.length === 0 && (
            <div style={{ opacity: 0.8, fontStyle: "italic" }}>
              Nenhum estudo pendente no momento.
            </div>
          )}

          {!loading && !err && items.length > 0 && (
            <div className="grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {items.map((it) => {
                const isOpen = !!expanded[it._id];
                const isBusy = busyId === it._id;

                return (
                  <div key={it._id} className="card" style={{ border: "1px solid #e9e9e9", borderRadius: 12, padding: 14, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: "0 0 6px", lineHeight: 1.2, fontSize: 18 }}>
                          {it.title}
                        </h3>
                        <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                          Tema: <strong>{it.theme}</strong>
                          {it.author?.username ? <> · por <strong>@{it.author.username}</strong></> : null}
                        </p>
                      </div>
                      <button
                        className="toggle"
                        onClick={() => setExpanded((ex) => ({ ...ex, [it._id]: !isOpen }))}
                        aria-label="Mostrar/ocultar conteúdo"
                        style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
                      >
                        {isOpen ? "–" : "+"}
                      </button>
                    </div>

                    {it.image?.url && (
                      <div style={{ marginTop: 10 }}>
                        <img
                          src={it.image.url}
                          alt={it.image.alt || it.title}
                          style={{ width: "100%", borderRadius: 8, border: "1px solid #eee" }}
                        />
                      </div>
                    )}

                    {isOpen && (
                      <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 }}>
                        {it.content}
                      </div>
                    )}

                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      <button
                        onClick={() => handleApprove(it._id)}
                        disabled={isBusy || !approverId}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid #2e7d32",
                          background: "#2e7d32",
                          color: "#fff",
                          cursor: isBusy || !approverId ? "not-allowed" : "pointer",
                          fontWeight: 600,
                        }}
                        title={!approverId ? "Faça login como gestor para aprovar" : "Aprovar estudo"}
                      >
                        {isBusy ? "Processando..." : "Aprovar"}
                      </button>

                      <div style={{ display: "grid", gap: 8 }}>
                        <textarea
                          value={reasons[it._id] || ""}
                          onChange={(e) => setReasons((r) => ({ ...r, [it._id]: e.target.value }))}
                          placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                          rows={3}
                          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", resize: "vertical" }}
                        />
                        <button
                          onClick={() => handleReject(it._id)}
                          disabled={isBusy || !(reasons[it._id] || "").trim()}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #c62828",
                            background: "#c62828",
                            color: "#fff",
                            cursor: isBusy || !(reasons[it._id] || "").trim() ? "not-allowed" : "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {isBusy ? "Processando..." : "Rejeitar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 16 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e2e2", background: "#fff" }}
              >
                ← Anterior
              </button>
              <span> Página {page} de {totalPages} </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e2e2", background: "#fff" }}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default PendingStudies;
