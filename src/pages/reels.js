import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import "../styles/reels.css";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const videoRefs = useRef([]);

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

  return (
    <div className="reelsWrapper">
      {reels.map((reel, index) => (
        <div className="reelContainer" key={reel._id}>
          
          <div className="reelItemWrap">
            <div
              className="reelItem"
              >
              <video
              ref={(el) => (videoRefs.current[index] = el)}
                src={reel.videoUrl}
                loop
                playsInline
                // controls={true}
                preload="auto"
                className="reelVideo"
              />
              <div className="reelDescription">
                {reel.description || "Sem descrição"}
              </div>

              {/* <div className="reelActions">
              <button className="reelActionButton">❤️</button>
              <button className="reelActionButton">💬</button>
              <button className="reelActionButton">🔖</button>
              <button className="reelActionButton">🔗</button>
            </div> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reels;
