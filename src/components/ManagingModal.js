import React, { useState, useEffect } from "react";

export const ManagingModal = ({
  setManagingModal,
  setLeaderMenuLevel,
  leaderMenuLevel,
  onDelete,
  onStrike,
  getStrikeHistory,  // ✅ função que retorna dados
  listingId,
  userId,
}) => {
  const [strikeReason, setStrikeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  console.log("✅ userId:", userId)

  // Abas: "newStrike" | "history"
  const [tab, setTab] = useState("newStrike");

  // Histórico
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyErr, setHistoryErr] = useState(null);

  const MIN_REASON = 3;

  const closeAll = () => {
    setLeaderMenuLevel("1");
    setManagingModal(null);
  };

  // Carrega o histórico quando trocar pra aba "history"
  useEffect(() => {
    if (tab !== "history" || !getStrikeHistory || !userId) return;

    const ac = new AbortController();
    setLoadingHistory(true);
    setHistoryErr(null);

    getStrikeHistory(userId)
      .then((h) => setHistory(Array.isArray(h) ? h : (h?.items ?? h?.history ?? [])))
      .catch((err) => setHistoryErr(err))
      .finally(() => setLoadingHistory(false));

    return () => ac.abort();
  }, [tab, userId, getStrikeHistory]);

  console.log("history:", history)

  return (
    <div className="modal" onClick={closeAll}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ======= nível 1 -> deletar ou ir para strike ======== */}
        {leaderMenuLevel === "1" && (
          <ul>
            <li>
              <button
                onClick={async () => {
                  try {
                    await onDelete?.();
                    closeAll();
                  } catch (e) {
                    alert(e?.message || "Erro ao deletar.");
                  }
                }}
              >
                delete
              </button>
            </li>
            <li>
              <button onClick={() => setLeaderMenuLevel("2")}>Strike</button>
            </li>
          </ul>
        )}

        {/* ======= nível 2 -> abas: Criar / Histórico ======== */}
        {leaderMenuLevel === "2" && (
          <div className="strike-panel" style={{ display: "grid", gap: 12 }}>
            {/* Abas */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={tab === "newStrike" ? "active" : ""}
                onClick={() => setTab("newStrike")}
              >
                Criar Strike
              </button>
              <button
                type="button"
                className={tab === "history" ? "active" : ""}
                onClick={() => setTab("history")}
              >
                Ver Histórico
              </button>
            </div>

            {/* Conteúdo da aba "Criar Strike" */}
            {tab === "newStrike" && (
              <form
                className="strike-inline"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!onStrike) return;
                  if (strikeReason.trim().length < MIN_REASON) {
                    alert(`Explique o motivo (mín. ${MIN_REASON} caracteres).`);
                    return;
                  }
                  try {
                    setSubmitting(true);
                    await onStrike(strikeReason.trim());
                    closeAll();
                  } catch (err) {
                    alert(err?.message || "Falha ao enviar strike.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                style={{ display: "grid", gap: 8 }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>Dando um strike…</p>

                <textarea
                  className="strikeTextArea"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="Explique brevemente o motivo…"
                />
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {strikeReason.length}/400
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" className="tiny ghost" onClick={closeAll}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="tiny"
                    disabled={submitting || strikeReason.trim().length < MIN_REASON}
                  >
                    {submitting ? "Enviando…" : "Concluir"}
                  </button>
                </div>
              </form>
            )}

            {/* Conteúdo da aba "Histórico" */}
            {tab === "history" && (
              <div className="strike-history" style={{ maxHeight: 280, overflow: "auto" }}>
                {loadingHistory && <p>Carregando…</p>}
                {historyErr && (
                  <p className="error">Erro: {historyErr.message || String(historyErr)}</p>
                )}
                {!loadingHistory && !historyErr && history.length === 0 && (
                  <p>Sem strikes para este usuário.</p>
                )}
                {!loadingHistory && !historyErr && history.length > 0 && (
                  <ul style={{ display: "grid", gap: 8, paddingLeft: 16 }}>
                    {history.map((s) => {
                      const id = s._id || `${s.createdAt}-${s.reason}`;
                      const when = s.createdAt || s.date;
                      const by = s.by?.username || s.admin?.username || s.by || s.admin || "";

                      return (
                        
                        <li key={id} style={{ borderBottom: "1px solid #eee", paddingBottom: 6 }}>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {when ? new Date(when).toLocaleString() : "—"}
                            {by ? ` • por @${by}` : ""}
                          </div>
                          <div style={{ marginTop: 4 }}>{s.reason || s.strikeReason || "(sem motivo)"}</div>
                          {s.listingId && (
                            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
                              Listing: {typeof s.listingId === "object" ? s.listingId._id : s.listingId}
                            </div>
                          )}
                        </li>
                        
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
