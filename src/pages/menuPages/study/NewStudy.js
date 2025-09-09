// src/pages/theme/NewStudy.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// ajuste estes imports conforme a sua estrutura:
// import Header from "../../../components/Header";
// import Footer from "../../../components/Footer";
import { createThemeStudy } from "../../functions/ThemeStudiesFunctions"
import { useUser } from "../../../context/UserContext";
import "../../../styles/Study.css";

const THEME_OPTIONS = [
  { value: "", label: "Selecione um tema" },
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

const TITLE_MAX = 180;
const ALT_MAX = 140;

export const NewStudy = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser?.() || { currentUser: null };

  // form state
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // ui state
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const canSubmit =
    !busy &&
    title.trim().length > 0 &&
    theme.trim().length > 0 &&
    content.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr("");
    setOkMsg("");

    try {
      const payload = {
        title: title.trim(),
        theme: theme.trim().toLowerCase(),
        content: content.trim(),
      };
      if (imageUrl.trim()) {
        payload.image = {
          url: imageUrl.trim(),
          alt: imageAlt.trim() || undefined,
        };
      }

      const out = await createThemeStudy(payload);
      if (!out?.ok) {
        setErr(out?.message || "Falha ao enviar estudo.");
        return;
      }

      setOkMsg("Estudo enviado com sucesso! Ele entrará em revisão.");
      // limpa o formulário
      setTitle("");
      setTheme("");
      setContent("");
      setImageUrl("");
      setImageAlt("");

      // Se tiver user em contexto, leva para "Meus Estudos"
      if (currentUser?._id) {
        setTimeout(() => {
          navigate(`/manageStudies`);
        }, 400);
      }
    } catch (e2) {
      setErr(e2?.message || "Erro ao enviar estudo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* <Header showProfileImage /> */}
      <div className="landingListingsContainer studyPage">
        <div className="container" style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ margin: "8px 0 4px" }}>Novo Estudo por Tema</h1>
          <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
            Preencha os campos abaixo para enviar seu estudo. Ele ficará{" "}
            <strong>pendente</strong> até aprovação.
          </p>

          {err && (
            <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>
          )}
          {okMsg && (
            <div style={{ color: "#1e4620", marginBottom: 12 }}>
              {okMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
            <div style={{ display: "grid", gap: 12 }}>
              {/* Título */}
              <label className="label">
                Título <span style={{ opacity: 0.6 }}>(máx. {TITLE_MAX})</span>
                <input
                  className="input"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value.slice(0, TITLE_MAX))
                  }
                  placeholder="Ex.: A suficiência da graça"
                  required
                />
                <small style={{ opacity: 0.6 }}>
                  {title.length}/{TITLE_MAX}
                </small>
              </label>

              {/* Tema */}
              <label className="label">
                Tema
                <select
                  className="select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  required
                >
                  {THEME_OPTIONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Conteúdo */}
              <label className="label">
                Conteúdo
                <textarea
                  className="input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva seu estudo aqui (markdown ou texto puro)."
                  rows={12}
                  required
                />
              </label>

              {/* Imagem (opcional) */}
              <fieldset
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <legend style={{ padding: "0 6px", opacity: 0.85 }}>
                  Imagem (opcional)
                </legend>
                <label className="label" style={{ marginBottom: 8 }}>
                  URL
                  <input
                    className="input"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    pattern="https?://.+"
                  />
                </label>
                <label className="label">
                  Texto alternativo{" "}
                  <span style={{ opacity: 0.6 }}>(máx. {ALT_MAX})</span>
                  <input
                    className="input"
                    type="text"
                    value={imageAlt}
                    onChange={(e) =>
                      setImageAlt(e.target.value.slice(0, ALT_MAX))
                    }
                    placeholder="Descrição curta da imagem"
                    disabled={!imageUrl.trim()}
                  />
                  <small style={{ opacity: 0.6 }}>
                    {imageAlt.length}/{ALT_MAX}
                  </small>
                </label>

                {imageUrl.trim() && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={imageUrl.trim()}
                      alt={imageAlt || "Pré-visualização"}
                      style={{
                        maxWidth: "100%",
                        borderRadius: 8,
                        border: "1px solid #eee",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </fieldset>

              {/* Ações */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <button
                  type="submit"
                  className="clearBtn"
                  style={{
                    padding: "10px 14px",
                    background: "#2e7d32",
                    color: "#fff",
                    border: "1px solid #2e7d32",
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                  disabled={!canSubmit}
                >
                  {busy ? "Enviando..." : "Enviar para revisão"}
                </button>

                <button
                  type="button"
                  className="clearBtn"
                  onClick={() => {
                    setTitle("");
                    setTheme("");
                    setContent("");
                    setImageUrl("");
                    setImageAlt("");
                    setErr("");
                    setOkMsg("");
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: "#fff",
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default NewStudy;
