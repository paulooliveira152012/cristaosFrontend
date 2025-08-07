import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import "../styles/reels.css";
import ReelInteractionComponent from "../components/ReelInteractionComponent";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);
  const [showMessages, setShowMessages] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchReels = async () => {
      const url = `${process.env.REACT_APP_API_BASE_URL}`;
      console.log("Fetching reels from:", url);
      try {
        const response = await fetch(`${url}/api/listings/allreels`);
        const data = await response.json();
        console.log("Fetched reels:", data);

        if (Array.isArray(data.reels)) {
          setReels(data.reels);
        } else {
          console.error("API didn't return an array:", data);
          setReels([]);
        }
      } catch (error) {
        console.error("Error fetching reels:", error);
        setReels([]);
      }
    };

    fetchReels();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.9 }
    );

    videoRefs.current.forEach(
      (video) => {
        if (video) observer.observe(video);
      },
      [reels]
    );

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [reels]);

  const toggleShowMessages = () => {
    console.log("toggling show comments");
    setShowMessages((prev) => !prev);
  };

  // Bloqueia scroll e teclas quando modal aberto
  useEffect(() => {
    if (showMessages) {
      document.body.style.overflow = "hidden";

      const blockKeys = (e) => {
        const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
        if (keys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const blockScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      window.addEventListener("keydown", blockKeys, { capture: true });
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });

      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", blockKeys, { capture: true });
        window.removeEventListener("wheel", blockScroll);
        window.removeEventListener("touchmove", blockScroll);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [showMessages]);

  return (
    <div className={`reelsWrapper ${showMessages ? "locked" : ""}`}>
      {reels.length === 0 ? (
        <div className="noReelsMessage">Nenhum reel disponível no momento.</div>
      ) : (
        reels.map((reel, index) => (
          <div className="reelContainer" key={reel._id}>
            <div className="reelItemWrap">
              <div className="reelItem">
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={reel.videoUrl}
                  loop
                  playsInline
                  preload="auto"
                  className="reelVideo"
                />
                <ReelInteractionComponent toggleShowMessages={toggleShowMessages} />
                <div className="reelDescription">
                  {reel.description || "Sem descrição"}
                </div>
              </div>
              {showMessages && (
                <div
                  className="modalClear"
                  onClick={toggleShowMessages}
                  role="dialog"
                  aria-modal="true"
                  tabIndex={-1}
                  ref={modalRef}
                >
                  <div
                    className={`commentSection ${showMessages ? "show" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Reels;
