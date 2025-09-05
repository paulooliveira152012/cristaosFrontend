import { useState, useEffect, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { fetchAllReports, updateReportStatus } from "./functions/ReportFunctions";
import { banMember, strike } from "../../functions/leaderFunctions";

export const ReportAdmin = () => {
  const { currentUser } = useUser();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("open"); // open | resolved | dismissed | all
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null); // report selecionado (detalhe)

  const isLeader = !!(currentUser?.leader || currentUser?.role === "leader");

  const load = async () => {
    if (!isLeader) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAllReports(currentUser);
      setReports(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e?.message || "Falha ao carregar reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  const filtered = useMemo(() => {
    let list = reports;
    if (filter !== "all") {
      list = list.filter((r) => (r.status || "open") === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const repBy =
          typeof r.reportingUser === "object"
            ? r.reportingUser?.username || r.reportingUser?.email || ""
            : String(r.reportingUser || "");
        const repTo =
          typeof r.reportedUser === "object"
            ? r.reportedUser?.username || r.reportedUser?.email || ""
            : String(r.reportedUser || "");
        return (
          (r.reason || "").toLowerCase().includes(q) ||
          repBy.toLowerCase().includes(q) ||
          repTo.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [reports, filter, search]);

  const refreshOne = (id, mutate) => {
    setReports((prev) =>
      prev.map((r) => (String(r._id) === String(id) ? mutate(r) : r))
    );
  };

  const handleStatus = async (reportId, statusLabel, askNote = false) => {
    try {
      let note;
      if (askNote) {
        const input = window.prompt("Observação (opcional):", "");
        if (input === null) return; // cancelou
        note = input.trim() || undefined;
      }
      const out = await updateReportStatus(reportId, statusLabel, note);
      if (!out?.ok) throw new Error(out?.message || "Falha ao atualizar status");
      refreshOne(reportId, () => out.item || { ...out, _id: reportId });
    } catch (e) {
      alert(e?.message || "Erro ao atualizar status do report.");
    }
  };

  const handleStrike = async (report) => {
    const targetId =
      typeof report.reportedUser === "object"
        ? report.reportedUser?._id
        : report.reportedUser;

    const defaultReason = report.reason || "Violação das regras";
    const reason = window.prompt("Motivo do strike:", defaultReason);
    if (reason == null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      alert("Informe um motivo.");
      return;
    }

    try {
      const resp = await strike({
        userId: targetId,
        listingId: report.listingId || null,
        strikeReason: trimmed,
      });

      if (resp?.action === "banned") {
        alert("Usuário banido automaticamente ao atingir 3 strikes.");
        await handleStatus(report._id, "resolved"); // marca como resolvido
      } else if (resp?.ok) {
        alert("Strike registrado com sucesso.");
        await handleStatus(report._id, "resolved");
      } else {
        throw new Error(resp?.error || "Falha ao aplicar strike.");
      }
    } catch (e) {
      alert(e?.message || "Erro ao aplicar strike.");
    }
  };

  const handleBan = async (report) => {
    const targetId =
      typeof report.reportedUser === "object"
        ? report.reportedUser?._id
        : report.reportedUser;

    const ok = window.confirm("Tem certeza que deseja banir este usuário?");
    if (!ok) return;

    try {
      const res = await banMember({
        isLeader,
        userId: targetId,
        reason: `Ban via report: ${report.reason || ""}`,
      });
      if (!res?.ok) throw new Error(res?.message || "Falha ao banir.");
      alert("Usuário banido.");
      await handleStatus(report._id, "resolved");
    } catch (e) {
      alert(e?.message || "Erro ao banir usuário.");
    }
  };

  if (!isLeader) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Gerenciar Relatórios</h2>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Gerenciar Relatórios</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="open">Abertos</option>
          <option value="resolved">Resolvidos</option>
          <option value="dismissed">Descartados</option>
          <option value="all">Todos</option>
        </select>
        <input
          placeholder="Buscar por usuário ou motivo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={load}>Recarregar</button>
      </div>

      {loading && <p>Carregando…</p>}
      {err && <p style={{ color: "crimson" }}>Erro: {err}</p>}

      {!loading && !err && filtered.length === 0 && (
        <p>Nenhum report para exibir.</p>
      )}

      {!loading && !err && filtered.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f7f7f7" }}>
              <tr>
                <th style={th}>Quando</th>
                <th style={th}>Reporter</th>
                <th style={th}>Reportado</th>
                <th style={th}>Motivo</th>
                <th style={th}>Evidências</th>
                <th style={th}>Status</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = r.status || "open";
                const evidCount = Array.isArray(r.evidence) ? r.evidence.length : 0;
                const created = r.createdAt ? new Date(r.createdAt) : null;
                const reporterName =
                  typeof r.reportingUser === "object"
                    ? r.reportingUser?.username || r.reportingUser?.email || r.reportingUser?._id
                    : r.reportingUser;
                const reportedName =
                  typeof r.reportedUser === "object"
                    ? r.reportedUser?.username || r.reportedUser?.email || r.reportedUser?._id
                    : r.reportedUser;

                return (
                  <tr key={r._id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>
                      {created ? created.toLocaleString() : "—"}
                    </td>
                    <td style={td}>{reporterName || "—"}</td>
                    <td style={td}>{reportedName || "—"}</td>
                    <td style={{ ...td, maxWidth: 320 }}>
                      <span title={r.reason}>{(r.reason || "").slice(0, 120)}{(r.reason||"").length>120?"…":""}</span>
                    </td>
                    <td style={td}>{evidCount}</td>
                    <td style={td}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          background:
                            status === "open"
                              ? "#ffefe0"
                              : status === "resolved"
                              ? "#e6ffed"
                              : "#f0f1f5",
                          border:
                            status === "open"
                              ? "1px solid #ffd2a8"
                              : status === "resolved"
                              ? "1px solid #a4e7b1"
                              : "1px solid #d8dbe3",
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => setActive(r)}>Ver</button>
                        {status === "open" && (
                          <>
                            <button onClick={() => handleStrike(r)}>Strike</button>
                            <button onClick={() => handleBan(r)}>Banir</button>
                            <button onClick={() => handleStatus(r._id, "dismissed", true)}>
                              Descartar
                            </button>
                            <button onClick={() => handleStatus(r._id, "resolved", true)}>
                              Resolver
                            </button>
                          </>
                        )}
                        {status !== "open" && (
                          <button onClick={() => handleStatus(r._id, "open")}>
                            Reabrir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal simples de detalhes */}
      {active && (
        <div
          onClick={() => setActive(null)}
          style={modalBackdrop}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={modalCard}
          >
            <h3>Reporte</h3>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {active.createdAt ? new Date(active.createdAt).toLocaleString() : "—"}
              {" · "}
              Status: <b>{active.status || "open"}</b>
            </div>

            <div style={{ marginTop: 12 }}>
              <div><b>Reporter:</b> {typeof active.reportingUser === "object" ? (active.reportingUser?.username || active.reportingUser?.email || active.reportingUser?._id) : active.reportingUser}</div>
              <div><b>Reportado:</b> {typeof active.reportedUser === "object" ? (active.reportedUser?.username || active.reportedUser?.email || active.reportedUser?._id) : active.reportedUser}</div>
              {active.listingId && (
                <div><b>Listing:</b> {typeof active.listingId === "object" ? active.listingId?._id : active.listingId}</div>
              )}
            </div>

            <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              <b>Motivo:</b> {active.reason || "—"}
            </p>

            {Array.isArray(active.evidence) && active.evidence.length > 0 && (
              <>
                <h4>Evidências</h4>
                <ul style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
                  {active.evidence.map((ev, i) => {
                    const kind = ev?.type || "file";
                    if (kind === "image" && ev.url) {
                      return (
                        <li key={i}>
                          <a href={ev.url} target="_blank" rel="noreferrer">
                            Ver imagem ({ev.filename || "arquivo"})
                          </a>
                        </li>
                      );
                    }
                    if (ev.url) {
                      return (
                        <li key={i}>
                          <a href={ev.url} target="_blank" rel="noreferrer">
                            {ev.filename || ev.url}
                          </a>
                        </li>
                      );
                    }
                    if (ev.text) {
                      return <li key={i}><code style={{ whiteSpace: "pre-wrap" }}>{ev.text}</code></li>;
                    }
                    return <li key={i}>Evidência #{i + 1}</li>;
                  })}
                </ul>
              </>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setActive(null)}>Fechar</button>
              {(active.status || "open") === "open" ? (
                <>
                  <button onClick={() => handleStrike(active)}>Strike</button>
                  <button onClick={() => handleBan(active)}>Banir</button>
                  <button onClick={() => handleStatus(active._id, "dismissed", true)}>Descartar</button>
                  <button onClick={() => handleStatus(active._id, "resolved", true)}>Resolver</button>
                </>
              ) : (
                <button onClick={() => handleStatus(active._id, "open")}>Reabrir</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// estilos inline simples
const th = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #eee" };
const td = { padding: "10px 12px", fontSize: 13, verticalAlign: "top" };

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};
const modalCard = {
  width: "min(800px, 95vw)",
  maxHeight: "85vh",
  overflow: "auto",
  background: "white",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
