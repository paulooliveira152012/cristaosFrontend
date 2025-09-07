// src/pages/StudyChapter.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Header from "../../../components/Header";
import { useUser } from "../../../context/UserContext";
import {
  fetchStudyByChapter,
  upsertStudy,
  deleteStudy,
} from "../../functions/studyFunctions";

export default function StudyChapter() {
  const { currentUser } = useUser();
  const isLeader = !!(currentUser?.leader || currentUser?.role === "leader");

  const { bookId, chapter } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const bookName = location.state?.name || bookId;

  const [study, setStudy] = useState(null); // { _id, bookId, chapter, title, content, author }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const out = await fetchStudyByChapter(bookId, Number(chapter));
        if (stop) return;

        if (out?.ok && out.item) {
          setStudy(out.item);
          setTitle(out.item.title || "");
          setContent(out.item.content || "");
        } else {
          // sem estudo ainda
          setStudy(null);
          setTitle("");
          setContent("");
        }
      } catch (e) {
        setErr(e?.message || "Falha ao carregar o estudo.");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [bookId, chapter]);

  const handleSave = async () => {
    try {
      const payload = {
        bookId,
        chapter: Number(chapter),
        title: title.trim() || `${bookName} ${chapter}`,
        content: content.trim(),
        author: currentUser._id,
      };
      const out = await upsertStudy(payload); // cria ou atualiza
      if (!out?.ok) throw new Error(out?.message || "Falha ao salvar.");
      setStudy(out.item);
      setEditing(false);
      alert("Estudo salvo.");
    } catch (e) {
      alert(e?.message || "Erro ao salvar estudo.");
    }
  };

  const handleDelete = async () => {
    if (!study?._id) return;
    if (!window.confirm("Excluir este estudo?")) return;
    try {
      const out = await deleteStudy(study._id);
      if (!out?.ok) throw new Error(out?.message || "Falha ao excluir.");
      setStudy(null);
      setTitle("");
      setContent("");
      setEditing(false);
      alert("Estudo excluído.");
    } catch (e) {
      alert(e?.message || "Erro ao excluir estudo.");
    }
  };

  return (
    <>
      <div className="landingListingsContainer">
        <div className="scrollable">
          <Header showProfileImage={false} onBack={() => navigate(-1)} />
          <div className="landingListingsContainer" style={{ padding: 16 }}>

            <h2>
              {bookName} {chapter}
            </h2>

            {loading && <p>Carregando…</p>}
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            {!loading && !err && (
              <>
                {!editing ? (
                  <>
                    {study ? (
                      <>
                        <h3 style={{ marginTop: 8 }}>{study.title}</h3>
                        <div
                          style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                        >
                          {study.content}
                        </div>
                        {study.author && (
                          <p style={{ opacity: 0.7, marginTop: 12 }}>
                            por @{study.author?.username || "líder"}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="ch-note">
                        Ainda não há estudo para este capítulo.
                      </p>
                    )}

                    {isLeader && (
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button
                          onClick={() => {
                            setEditing(true);
                          }}
                        >
                          {study ? "Editar" : "Criar estudo"}
                        </button>
                        {study && (
                          <button onClick={handleDelete}>Excluir</button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    <input
                      placeholder="Título do estudo"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />
                    <textarea
                      placeholder="Conteúdo do estudo (pode colar seu texto aqui)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleSave}>Salvar</button>
                      <button onClick={() => setEditing(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
