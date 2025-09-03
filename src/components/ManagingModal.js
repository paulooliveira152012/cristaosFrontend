import React, { useState } from "react";

export const ManagingModal = ({
  setManagingModal,
  setLeaderMenuLevel,
  leaderMenuLevel,
  // props novas:
  onDelete,          // () => Promise|void
  onStrike,          // (reason: string) => Promise|void
  listingId,         // string (opcional aqui, mas útil p/ data-attrs/debug)
  userId,            // string (idem)
}) => {
  const [strikeReason, setStrikeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const MIN_REASON = 3;

  const closeAll = () => {
    setLeaderMenuLevel("1");
    setManagingModal(null);
  };

  return (
    <div className="modal" onClick={closeAll}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ======= nível 1 -> deletar ou dar strike ======== */}
        {leaderMenuLevel === "1" && (
          <ul>
            <li>
              <button
                onClick={async () => {
                  try {
                    await onDelete?.(); // pai já sabe qual listing deletar
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

        {/* ======= nível 2 -> motivo do strike ======== */}
        {leaderMenuLevel === "2" && (
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
            onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>
  );
};
