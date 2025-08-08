import React, { useEffect, useRef, useState } from "react";
import "../styles/reels.css";
import ReelInteractionComponent from "../components/ReelInteractionComponent";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);
  const [openId, setOpenId] = useState(null); // <- qual reel está com comentários abertos
  const isAnyOpen = openId !== null;

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
      entries => entries.forEach(({ isIntersecting, target }) =>
        isIntersecting ? target.play().catch(()=>{}) : target.pause()
      ),
      { threshold: 0.9 }
    );
    videoRefs.current.forEach(v => v && obs.observe(v));
    return () => obs.disconnect();
  }, [reels]);

  // trava scroll do body quando QUALQUER modal está aberto
  useEffect(() => {
    document.body.style.overflow = isAnyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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
                    {/* seu conteúdo de comentários aqui */}
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
