// components/ModerationManager.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Props
 * - isOpen: boolean
 * - onClose: () => void
 * - action: "strike" | "ban"
 * - targetUserId: string
 * - listingId?: string | null
 * - currentUser: { _id, role, username, profileImage }
 *
 * APIs
 * - fetchUserStrikes?: (userId) => Promise<{ strikes: any[] }>
 * - issueStrike?: ({ userId, listingId?, reason }) => Promise<{ ok, strike?, error? }>
 * - fetchBanStatus?: (userId) => Promise<{ ok, isBanned, bannedAt?, bannedBy?, banReason? }>
 * - issueBan?: ({ userId, reason, durationDays? | permanent? }) => Promise<{ ok, error? }>
 * - revokeBan?: ({ userId }) => Promise<{ ok, error? }>
 */
export default function ModerationManager({
  isOpen,
  onClose,
  action = "strike",
  targetUserId,
  listingId = null,
  currentUser,

  // Strike APIs
  fetchUserStrikes,
  issueStrike,

  // Ban APIs
  fetchBanStatus,
  issueBan,
  revokeBan,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // common
  const isLeader = currentUser?.role === "leader";

  // strike
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState([]);

  // ban
  const [banReason, setBanReason] = useState("");
  const [permanent, setPermanent] = useState(true);
  const [durationDays, setDurationDays] = useState(7);
  const [banStatus, setBanStatus] = useState({
    isBanned: false,
    bannedAt: null,
    bannedBy: null,
    banReason: "",
  });

  // Carregar dados iniciais conforme a ação
  useEffect(() => {
    let cancelled = false;

    async function loadStrikeHistory() {
      if (!isOpen || action !== "strike" || !fetchUserStrikes || !targetUserId) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetchUserStrikes(targetUserId);
        if (!cancelled) setHistory(Array.isArray(res?.strikes) ? res.strikes : []);
      } catch {
        if (!cancelled) setError("Falha ao carregar histórico de strikes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadBan() {
      if (!isOpen || action !== "ban" || !fetchBanStatus || !targetUserId) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetchBanStatus(targetUserId);
        if (!cancelled && res?.ok) {
          setBanStatus({
            isBanned: !!res.isBanned,
            bannedAt: res.bannedAt || null,
            bannedBy: res.bannedBy || null,
            banReason: res.banReason || "",
          });
        }
      } catch {
        if (!cancelled) setError("Falha ao carregar status de banimento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (action === "strike") loadStrikeHistory();
    if (action === "ban") loadBan();

    return () => { cancelled = true; };
  }, [isOpen, action, targetUserId, fetchUserStrikes, fetchBanStatus]);

  // Filtro por listagem no histórico de strikes
  const filteredHistory = useMemo(() => {
    if (action !== "strike") return [];
    if (!listingId) return history;
    return history.filter((s) => String(s.listingId?._id || s.listingId) === String(listingId));
  }, [action, history, listingId]);

  // Validações
  const canSubmitStrike = isLeader && reason.trim().length >= 3;
  const canSubmitBan = isLeader && (
    (permanent && banReason.trim().length >= 3) ||
    (!permanent && durationDays > 0 && banReason.trim().length >= 3)
  );

  // Ações
  const submitStrike = async () => {
    if (!canSubmitStrike || !issueStrike) return;
    setLoading(true);
    setError("");
    try {
      const { ok, strike, error: apiErr } = await issueStrike({
        userId: targetUserId,
        listingId,
        reason: reason.trim(),
      });
      if (!ok) {
        setError(apiErr || "Não foi possível registrar o strike.");
        setLoading(false);
        return;
      }

      // Otimista no histórico
      const optimistic = {
        _id: strike?._id || `temp-${Date.now()}`,
        listingId: listingId ? { _id: listingId } : null,
        reason: reason.trim(),
        issuedBy: {
          _id: currentUser?._id,
          username: currentUser?.username || "líder",
          profileImage: currentUser?.profileImage || "",
        },
        issuedAt: new Date().toISOString(),
      };
      setHistory((prev) => [optimistic, ...prev]);
      setReason("");
      setStep(2);
    } catch {
      setError("Erro inesperado ao registrar o strike.");
    } finally {
      setLoading(false);
    }
  };

  const submitBan = async () => {
    if (!canSubmitBan || !issueBan) return;
    setLoading(true);
    setError("");
    try {
      const payload = permanent
        ? { userId: targetUserId, reason: banReason.trim(), permanent: true }
        : { userId: targetUserId, reason: banReason.trim(), durationDays: Number(durationDays) };

      const { ok, error: apiErr } = await issueBan(payload);
      if (!ok) {
        setError(apiErr || "Não foi possível banir o membro.");
        setLoading(false);
        return;
      }
      // Atualiza status local
      setBanStatus({
        isBanned: true,
        bannedAt: new Date().toISOString(),
        bannedBy: { _id: currentUser?._id, username: currentUser?.username || "líder" },
        banReason: banReason.trim(),
      });
      setStep(2);
    } catch {
      setError("Erro inesperado ao banir o membro.");
    } finally {
      setLoading(false);
    }
  };

  const undoBan = async () => {
    if (!revokeBan) return;
    setLoading(true);
    setError("");
    try {
      const { ok, error: apiErr } = await revokeBan({ userId: targetUserId });
      if (!ok) {
        setError(apiErr || "Não foi possível reverter o ban.");
        setLoading(false);
        return;
      }
      setBanStatus({ isBanned: false, bannedAt: null, bannedBy: null, banReason: "" });
    } catch {
      setError("Erro inesperado ao reverter o ban.");
    } finally {
      setLoading(false);
    }
  };

  // util
  const closeAll = () => {
    setStep(1);
    setReason("");
    setBanReason("");
    setDurationDays(7);
    setPermanent(true);
    setError("");
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={closeAll} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="strike-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3>{action === "strike" ? "Gerenciar Strike" : "Banir Membro"}</h3>
          <button className="tiny ghost" onClick={closeAll}>✕</button>
        </div>

        {error && (
          <div className="alert error" style={{ marginBottom: 8 }}>{error}</div>
        )}

        {/* Steps */}
        <div className="steps" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span className={`chip ${step === 1 ? "active" : ""}`}>1. {action === "strike" ? "Motivo" : "Configurar ban"}</span>
          <span className={`chip ${step === 2 ? "active" : ""}`}>2. {action === "strike" ? "Histórico" : "Status"}</span>
        </div>

        {/* STEP 1 */}
        {step === 1 && action === "strike" && (
          <div>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Motivo do strike</label>
            <textarea
              rows={4}
              placeholder="Explique brevemente o motivo (mín. 3 caracteres)…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={400}
              style={{ width: "100%", margin: "8px 0 4px" }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{reason.length}/400</div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="tiny ghost" onClick={closeAll}>Cancelar</button>
              <button className="tiny" disabled={!canSubmitStrike || loading} onClick={submitStrike}>
                {loading ? "Enviando…" : "Concluir"}
              </button>
            </div>
          </div>
        )}

        {step === 1 && action === "ban" && (
          <div>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Motivo do ban</label>
            <textarea
              rows={4}
              placeholder="Explique brevemente o motivo (mín. 3 caracteres)…"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              maxLength={400}
              style={{ width: "100%", margin: "8px 0 4px" }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{banReason.length}/400</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={permanent} onChange={() => setPermanent((v) => !v)} />
                Ban permanente
              </label>
              {!permanent && (
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Duração (dias)
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    style={{ width: 80 }}
                  />
                </label>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="tiny ghost" onClick={closeAll}>Cancelar</button>
              <button className="tiny" disabled={!canSubmitBan || loading} onClick={submitBan}>
                {loading ? "Aplicando…" : "Banir"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && action === "strike" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>Histórico de strikes</h4>
              {listingId && <span className="chip">Filtrado por listagem</span>}
            </div>

            {loading ? (
              <p>Carregando histórico…</p>
            ) : (filteredHistory.length === 0 ? (
              <p>Sem strikes anteriores{listingId ? " nesta listagem." : "."}</p>
            ) : (
              <ul className="strike-list" style={{ display: "grid", gap: 8, padding: 0 }}>
                {filteredHistory.map((s) => {
                  const author = s.issuedBy || {};
                  const date = new Date(s.issuedAt);
                  return (
                    <li key={s._id} style={{ listStyle: "none", border: "1px solid var(--card-border, #ddd)", borderRadius: 8, padding: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          backgroundImage: `url(${author.profileImage || ""})`,
                          backgroundSize: "cover", backgroundPosition: "center",
                          border: "1px solid #ccc",
                        }} />
                        <strong>@{author.username || "líder"}</strong>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>{date.toLocaleString()}</span>
                        {s.listingId && <span className="chip" title={String(s.listingId?._id || s.listingId)}>listing</span>}
                      </div>
                      <p style={{ marginTop: 6 }}>{s.reason || "(sem motivo informado)"}</p>
                    </li>
                  );
                })}
              </ul>
            ))}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="tiny" onClick={() => setStep(1)}>Novo strike</button>
              <button className="tiny ghost" onClick={closeAll}>Fechar</button>
            </div>
          </div>
        )}

        {step === 2 && action === "ban" && (
          <div>
            <h4 style={{ marginTop: 0 }}>Status do ban</h4>
            <p>
              <strong>Banido:</strong> {banStatus.isBanned ? "Sim" : "Não"}<br/>
              {banStatus.isBanned && (
                <>
                  <strong>Desde:</strong> {new Date(banStatus.bannedAt).toLocaleString()}<br/>
                  {banStatus.bannedBy?.username && (
                    <><strong>Por:</strong> @{banStatus.bannedBy.username}<br/></>
                  )}
                  {banStatus.banReason && (
                    <><strong>Motivo:</strong> {banStatus.banReason}<br/></>
                  )}
                </>
              )}
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {banStatus.isBanned && (
                <button className="tiny" disabled={loading} onClick={undoBan}>
                  {loading ? "Revertendo…" : "Reverter ban"}
                </button>
              )}
              <button className="tiny ghost" onClick={closeAll}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
