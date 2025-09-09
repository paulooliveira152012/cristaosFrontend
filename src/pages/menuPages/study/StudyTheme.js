// src/pages/StudyTheme.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getThemeStudyPublic } from "../../functions/ThemeStudiesFunctions"; // função nova (abaixo)

const StudyTheme = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const out = await getThemeStudyPublic(id);
        if (stop) return;
        if (!out?.ok) throw new Error(out?.message || "Não foi possível carregar o estudo.");
        setItem(out.item);
      } catch (e) {
        if (!stop) setErr(e?.message || "Erro ao carregar o estudo.");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [id]);

  return (
    <>
      <Header showProfileImage={false} navigate={navigate} />
      <div className="landingListingsContainer studyPage">
        <div className="container">
          {loading && <div>Carregando…</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}
          {!loading && !err && item && (
            <article className="card">
              <h1 className="cardTitle" style={{ fontSize: 22 }}>{item.title}</h1>
              <p className="cardMeta" style={{ marginBottom: 12 }}>
                Tema: <strong>{item.theme}</strong>
                {item.author?.username ? <> · por <strong>@{item.author.username}</strong></> : null}
              </p>

              {item.image?.url && (
                <div style={{ margin: "8px 0 16px" }}>
                  <img
                    src={item.image.url}
                    alt={item.image.alt || item.title}
                    style={{ width: "100%", borderRadius: 10, border: "1px solid #eee" }}
                  />
                </div>
              )}

              {/* conteúdo completo */}
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: 16 }}>
                {item.content}
              </div>
            </article>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StudyTheme;
