// src/pages/menuPages/StudyBook.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import { useUser } from "../../../context/UserContext";
import { fetchBookChapters } from "../../functions/studyFunctions";

// fallback simples: qtos capítulos tem cada livro (adicione aos poucos conforme usar)
const CHAPTERS = {
  genesis: 50, exodo: 40, levitico: 27, numeros: 36, deuteronomio: 34,
  mateus: 28, marcos: 16, lucas: 24, joao: 21, atos: 28, apocalipse: 22
};
const guessChapters = (bookId) => CHAPTERS[bookId] || 50;

export default function StudyBook() {
  const { currentUser } = useUser();
  const { bookId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isLeader = !!(currentUser?.leader || currentUser?.role === "leader");

  const [chapters, setChapters] = useState([]);   // [{chapter: 1, hasStudy: true}, ...]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const bookName = location.state?.name || bookId;

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        // tenta API; se não tiver, preenche fallback
        const out = await fetchBookChapters(bookId).catch(() => null);
        if (stop) return;

        if (out && Array.isArray(out.items)) {
          setChapters(out.items);
        } else {
          const total = guessChapters(bookId);
          setChapters(Array.from({ length: total }, (_, i) => ({
            chapter: i + 1,
            hasStudy: false
          })));
        }
      } catch (e) {
        setErr(e?.message || "Falha ao carregar capítulos.");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [bookId]);

  const total = useMemo(
    () => chapters.length || guessChapters(bookId),
    [chapters, bookId]
  );

  return (
    
    <>
      <Header showProfileImage={false} navigate={navigate} />
      <div className="bibleChaptersContainer">
      <div className="" style={{ padding: 16 }}>
        <h2>{bookName}</h2>
        {loading && <p>Carregando capítulos…</p>}
        {err && <p style={{ color: "crimson" }}>{err}</p>}

        {!loading && !err && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 8 }}>
            {chapters.map(({ chapter, hasStudy }) => (
              <Link
                key={chapter}
                to={`/study/${bookId}/${chapter}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: "10px 0",
                  background: hasStudy ? "#eef9f0" : "#fff",
                  textDecoration: "none",
                  color: "#111"
                }}
              >
                {chapter}{hasStudy ? " •" : ""}
              </Link>
            ))}
          </div>
        )}

        <p style={{ marginTop: 8, opacity: .8 }}>
          {total} capítulo(s){chapters.some(c => c.hasStudy) && " — os marcados com • já têm estudo"}
        </p>
      </div>
      </div>
    </>
  );
}
