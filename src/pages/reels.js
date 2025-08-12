import React, { useEffect, useRef, useState } from "react";
import "../styles/reels.css";
import ReelInteractionComponent from "../components/ReelInteractionComponent";
import { useUser } from "../context/UserContext";
import { handleSubmitComment, handleLike } from "./functions/reelsFunctions";
import { Link } from "react-router-dom";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);
  const [openId, setOpenId] = useState(null); // <- qual reel está com comentários abertos
  const isAnyOpen = openId !== null;
  const { currentUser } = useUser();
  const [newComment, setNewComment] = useState("");
  // drafts de comentário por reelId
  const [drafts, setDrafts] = useState({}); // { [reelId]: "texto" }
  const [liking, setLiking] = useState({}); // { [reelId]: boolean }

  console.log("currentUser:", currentUser);
  console.log("currentUser._id:", currentUser?._id);

  const onDraftChange = (reelId, value) =>
    setDrafts((d) => ({ ...d, [reelId]: value }));

  console.log("na pagina de rels...")

  useEffect(() => {
    const url = `${process.env.REACT_APP_API_BASE_URL}`;
    (async () => {
      try {
        const r = await fetch(`${url}/api/reels/allreels`);
        const d = await r.json();
        setReels(Array.isArray(d.reels) ? d.reels : []);
      } catch {
        setReels([]);
      }
    })();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(({ isIntersecting, target }) =>
          isIntersecting ? target.play().catch(() => {}) : target.pause()
        ),
      { threshold: 0.9 }
    );
    videoRefs.current.forEach((v) => v && obs.observe(v));
    return () => obs.disconnect();
  }, [reels]);

  // trava scroll do body quando QUALQUER modal está aberto
  useEffect(() => {
    document.body.style.overflow = isAnyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyOpen]);

  const submitComment = (reelId) => async () => {
    if (!currentUser?._id) return; // opcional: redirecionar/login
    const text = (drafts[reelId] || "").trim();
    if (!text) return;

    try {
      await handleSubmitComment({
        reelId,
        userId: currentUser._id,
        text,
      });

      // otimista: adiciona na lista local
      setReels((prev) =>
        prev.map((r) =>
          r._id === reelId
            ? {
                ...r,
                comments: [
                  ...(r.comments || []),
                  {
                    userId: currentUser._id,
                    username: currentUser.username,
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : r
        )
      );

      // limpa o draft só desse reel
      setDrafts((d) => ({ ...d, [reelId]: "" }));
    } catch (err) {
      console.error("Erro ao enviar comentário:", err);
    }
  };

  const toggleLike = async (reelId) => {
    if (!currentUser?._id || liking[reelId]) return;
    setLiking((m) => ({ ...m, [reelId]: true }));
    try {
      const res = await handleLike({ reelId, userId: currentUser._id });
      // res: { liked: boolean, likesCount: number }
      setReels((prev) =>
        prev.map((r) => {
          if (r._id !== reelId) return r;
          let nextLikes = Array.isArray(r.likes) ? [...r.likes] : [];
          const me = String(currentUser._id);
          const idx = nextLikes.findIndex((id) => String(id) === me);

          if (res?.liked && idx === -1) nextLikes.push(currentUser._id);
          if (!res?.liked && idx !== -1) nextLikes.splice(idx, 1);

          // opcional: confiar no likesCount vindo da API
          if (typeof res?.likesCount === "number") {
            // só garante o length coerente, mas mantém ids se possível
            if (res.likesCount !== nextLikes.length) {
              // fallback: não força; ou poderia cortar/adicionar placeholders
            }
          }
          return { ...r, likes: nextLikes };
        })
      );
    } catch (e) {
      console.error("like failed:", e);
    } finally {
      setLiking((m) => ({ ...m, [reelId]: false }));
    }
  };

  return (
    <div className={`reelsWrapper ${isAnyOpen ? "locked" : ""}`}>
      {reels.length === 0 ? (
        <div className="noReelsMessage">Nenhum reel disponível no momento.</div>
      ) : (
        reels.map((reel, index) => {
          const isOpen = openId === reel._id;
          return (
            <div className="reelContainer" key={reel._id}>
              <div className="reelItemWrap">
                <div className="reelItem">
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={reel.videoUrl}
                    loop
                    playsInline
                    muted
                    preload="auto"
                    className="reelVideo"
                  />

                  {/* Ações na direita */}
                  <div className="actionBar">
                    <button
                      className="actionBtn"
                      onClick={() => toggleLike(reel._id)}
                      disabled={!!liking[reel._id]}
                      style={{ opacity: liking[reel._id] ? 0.6 : 1 }}
                    >
                      <span>❤️</span>
                      <small>
                        {Array.isArray(reel.likes) ? reel.likes.length : 0}
                      </small>
                    </button>
                    <button
                      className="actionBtn"
                      onClick={() => setOpenId(reel._id)}
                    >
                      <span>💬</span>
                      <small>
                        {Array.isArray(reel.comments)
                          ? reel.comments.length
                          : 0}
                      </small>
                    </button>
                    <button
                      className="actionBtn"
                      onClick={() => {
                        /* share */
                      }}
                    >
                      <span>↗</span>
                      <small>Share</small>
                    </button>
                    <button
                      className="actionBtn"
                      onClick={() => {
                        /* save */
                      }}
                    >
                      <span>🔖</span>
                      <small>Save</small>
                    </button>
                  </div>

                  {/* Gradiente + legenda/autor */}
                  <div className="reelOverlay">
                    <div className="reelAuthor">
                      <Link to={`/profile/${reel.userId?._id}`}>
                        <img
                          src={
                            reel.userId?.profileImage ||
                            "/images/default-avatar.png"
                          }
                          alt={reel.userId?.username || "user"}
                        />
                      </Link>
                      <span>@{reel.userId?.username || "user"}</span>
                    </div>
                    <div className="reelCaption">
                      {reel.description || "Sem descrição"}
                    </div>
                  </div>
                </div>

                {/* Modal deste listing */}
                <div
                  className={`modalClear ${isOpen ? "visible" : ""}`}
                  onClick={() => setOpenId(null)}
                  role="dialog"
                  aria-modal="true"
                >
                  <div
                    className={`commentSection ${isOpen ? "open" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sheetHandle" />
                    <div className="commentsList">
                      {Array.isArray(reel.comments) &&
                      reel.comments.length > 0 ? (
                        reel.comments.map((comment, idx) => {
                          const username =
                            comment?.userId?.username ??
                            comment?.username ??
                            "Usuário";
                          const avatar =
                            comment?.userId?.profileImage ??
                            "/images/default-avatar.png";
                          return (
                            <div key={idx} className="commentItem">
                              <Link to={`/profile/${reel.userId?._id}`}>
                                <img
                                  className="commentAvatar"
                                  src={avatar}
                                  alt={username}
                                />
                              </Link>
                              <div className="commentBody">
                                <div className="commentHeader">
                                  <strong>{username}</strong>
                                  {/* <time>há 2h</time> se quiser formatar depois */}
                                </div>
                                <p className="commentText">{comment.text}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="noComments">
                          Nenhum comentário ainda.
                        </div>
                      )}
                    </div>

                    <div className="commentComposer">
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={drafts[reel._id] || ""}
                        onChange={(e) =>
                          onDraftChange(reel._id, e.target.value)
                        }
                      />
                      <button onClick={submitComment(reel._id)}>Enviar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Reels;
