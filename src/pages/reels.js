import React, { useEffect, useRef, useState } from "react";
import "../styles/reels.css";
import ReelInteractionComponent from "../components/ReelInteractionComponent";
import { useUser } from "../context/UserContext";
import { handleSubmitComment } from "./functions/reelsFunctions";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);
  const [openId, setOpenId] = useState(null); // <- qual reel está com comentários abertos
  const isAnyOpen = openId !== null;
  const { currentUser } = useUser();
  const [newComment, setNewComment] = useState("");
  // drafts de comentário por reelId
  const [drafts, setDrafts] = useState({}); // { [reelId]: "texto" }

  console.log("currentUser:", currentUser);
  console.log("currentUser._id:", currentUser?._id);

  const onDraftChange = (reelId, value) =>
    setDrafts((d) => ({ ...d, [reelId]: value }));

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
                  <ReelInteractionComponent
                    onOpen={() => setOpenId(reel._id)}
                    reelId={reel._id}
                    currentUserId={currentUser?._id || null} // or however you have the user
                    likes={
                      Array.isArray(reel.likes) && currentUser?._id
                        ? reel.likes.some(
                            (id) => String(id) === String(currentUser._id)
                          )
                        : false
                    }
                    likesCount={
                      Array.isArray(reel.likes) ? reel.likes.length : 0
                    }
                    saved={
                      Array.isArray(reel.savedBy) && currentUser?._id
                        ? reel.savedBy.some(
                            (id) => String(id) === String(currentUser._id)
                          )
                        : false
                    }
                  />
                  <div className="reelDescription">
                    {reel.description || "Sem descrição"}
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
                    {/* Lista de comentários */}
                    <div className="commentsList">
                      {Array.isArray(reel.comments) &&
                      reel.comments.length > 0 ? (
                        reel.comments.map((comment, idx) => {
                          const username =
                            typeof comment.userId === "object"
                              ? comment.userId?.username
                              : comment.username;
                          return (
                            <div key={idx} className="commentItem">
                              <strong>{username || "Usuário"}:</strong>{" "}
                              {comment.text}
                            </div>
                          );
                        })
                      ) : (
                        <div className="noComments">
                          Nenhum comentário ainda.
                        </div>
                      )}
                    </div>

                    {/* Campo de novo comentário */}
                    <div className="commentInputWrapper">
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        className="commentInput"
                        value={drafts[reel._id] || ""}
                        onChange={(e) =>
                          onDraftChange(reel._id, e.target.value)
                        }
                      />
                      <button
                        className="commentSendBtn"
                        onClick={submitComment(reel._id)}
                        // futuramente: onClick={handleSendComment}
                      >
                        Enviar
                      </button>
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
