import React, { useEffect, useRef, useState } from "react";
import "../styles/reels.css";
import ReelInteractionComponent from "../components/ReelInteractionComponent";
import { useUser } from "../context/UserContext";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);
  const [openId, setOpenId] = useState(null); // <- qual reel está com comentários abertos
  const isAnyOpen = openId !== null;
  const { currentUser } = useUser();

  console.log("currentUser:", currentUser);
  console.log("currentUser._id:", currentUser?._id);

  useEffect(() => {
    const url = `${process.env.REACT_APP_API_BASE_URL}`;
    (async () => {
      try {
        const r = await fetch(`${url}/api/listings/allreels`);
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
                    likes = {
                      Array.isArray(reel.likes) && currentUser?._id
                      ? reel.likes.some(id => String(id) === String(currentUser._id))
                      : false
                    }
                    likesCount = {Array.isArray(reel.likes) ? reel.likes.length : 0}
                    saved = {Array.isArray(reels.savedBy) && currentUser?._id
                      ? reel.savedBy.some(id => String(id) === String(currentUser._id))
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
                      {reel.comments && reel.comments.length > 0 ? (
                        reel.comments.map((comment, idx) => (
                          <div key={idx} className="commentItem">
                            <strong>{comment.username || "Usuário"}:</strong>{" "}
                            {comment.text}
                          </div>
                        ))
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
                        // futuramente: value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        className="commentSendBtn"
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
