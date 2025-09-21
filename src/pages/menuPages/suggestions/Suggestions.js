// src/pages/app/Suggestions.jsx
import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { useNavigate } from "react-router-dom";
import {
  fetchSuggestions as apiFetchSuggestions,
  handleSubmit as apiHandleSubmit,
  formatDate,
} from "../../functions/suggestions";
import { useUser } from "../../../context/UserContext";
import { authHeaders } from "../../functions/liveRoomFunctions2";

const Suggestions = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // carrega sugestões ao montar
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetchSuggestions({ headers: authHeaders });
        if (alive) setSuggestions(data);
      } catch (e) {
        console.error("falha ao carregar sugestões:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function submit() {
    if (!text.trim()) return;
    try {
      setSending(true);
      const payload = { suggestion: text.trim(), currentUser };
      const saved = await apiHandleSubmit(payload, { headers: authHeaders });
      setSuggestions((prev) => [saved, ...prev]);
      setText("");
      setOpen(false);
    } catch (err) {
      console.error("erro ao enviar sugestão:", err);
      alert("Não foi possível enviar sua sugestão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pageWrapper">
      <div className="scrollable">
        <Header showProfileImage={false} navigate={navigate} />

        <section style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Sugestões</h1>
              <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14 }}>
                Veja o que já foi enviado pela comunidade e contribua também.
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #0f172a",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              + Nova sugestão
            </button>
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          {loading ? (
            <p>Carregando…</p>
          ) : suggestions.length === 0 ? (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
                color: "#475569",
              }}
            >
              Nenhuma sugestão enviada ainda.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {suggestions.map((it) => (
                <li
                  key={it._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {it.title || it.suggestion || it.text || "(sem título)"}
                  </div>
                  <div style={{ fontSize: 14, color: "#334155", marginTop: 6 }}>
                    {it.description || it.suggestion || it.text || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                    Enviado por {it?.author?.name || "Anônimo"} •{" "}
                    {it.createdAt ? formatDate(it.createdAt) : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Modal */}
        {open && (
          <div className="modal" onMouseDown={() => !sending && setOpen(false)}>
            <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Nova sugestão</h3>
                <button
                  onClick={() => !sending && setOpen(false)}
                  aria-label="Fechar"
                  style={{ background: "transparent", border: 0, fontSize: 18, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#334155", marginBottom: 6 }}>
                  Escreva sua sugestão
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 10,
                    outline: "none",
                    color: "black"
                  }}
                  placeholder="Descreva sua ideia, melhoria ou problema encontrado…"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => !sending && setOpen(false)}
                  className="subtle"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  disabled={sending || !text.trim()}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #0f172a",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 600,
                    opacity: sending || !text.trim() ? 0.7 : 1,
                  }}
                >
                  {sending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suggestions;
