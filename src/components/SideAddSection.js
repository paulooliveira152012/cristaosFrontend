import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { fetchAllAds } from "./functions/addComponentFuncitons.js";
import "../styles/sideAddSection.css";
import socket from "../socket.js";

const SideAdSection = () => {
  const [adds, setAdds] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState([0, 1]); // Exibe 2 anúncios
  const [isHovered, setIsHovered] = useState([false, false]); // Hover individual
  const [fadeClass, setFadeClass] = useState([false, false]); // Fade individual
  const timeoutRefs = useRef([]);
  const { currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAds(setAdds);

    socket.on("newAdCreated", (ad) => {
      console.log("Novo anúncio recebido via socket:", ad);
      setAdds((prevAds) => [ad, ...prevAds]); // adiciona no topo da lista
    });

    return () => {
      socket.off("newAdCreated");
    };
  }, []);

  useEffect(() => {
    if (adds.length <= 2) return;

    const scheduleChange = (slot) => {
      const delay = Math.floor(Math.random() * 5000) + 5000; // 5s a 10s

      timeoutRefs.current[slot] = setTimeout(() => {
        if (isHovered[slot]) {
          scheduleChange(slot); // Se estiver com o mouse em cima, reagenda
          return;
        }

        // Inicia fade-out
        setFadeClass((prev) => {
          const updated = [...prev];
          updated[slot] = true;
          return updated;
        });

        setTimeout(() => {
          // Escolhe novo índice que não esteja sendo mostrado
          setCurrentIndexes((prev) => {
            const next = [...prev];
            let newIndex;
            do {
              newIndex = Math.floor(Math.random() * adds.length);
            } while (next.includes(newIndex));
            next[slot] = newIndex;
            return next;
          });

          // Fade-in novamente
          setFadeClass((prev) => {
            const updated = [...prev];
            updated[slot] = false;
            return updated;
          });

          scheduleChange(slot); // Agenda próxima troca
        }, 500); // tempo do fade
      }, delay);
    };

    scheduleChange(0);
    scheduleChange(1);

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [adds, isHovered]); // importante para refletir mudanças de hover

  return (
    <div className="sideAddSection">
      <div className="adsContainer">
        {currentIndexes.map((index, i) => {
          const ad = adds[index];
          if (!ad) return null;

          return (
            <div
              key={ad._id}
              className={`adItem ${fadeClass[i] ? "fade-out" : ""}`}
              onMouseEnter={() =>
                setIsHovered((prev) => {
                  const updated = [...prev];
                  updated[i] = true;
                  return updated;
                })
              }
              onMouseLeave={() =>
                setIsHovered((prev) => {
                  const updated = [...prev];
                  updated[i] = false;
                  return updated;
                })
              }
              onClick={() => navigate(`/ads/${ad._id}`)}
            >
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="adLink"
              >
                <img src={ad.imageUrl} alt={ad.title} className="adImage" />
                <div className="adDetails">
                  <h3>{ad.title}</h3>
                  <p>{ad.description}</p>
                </div>
              </a>
            </div>
          );
        })}
      </div>

      {currentUser?.leader && (
        <div className="addSectionHeader">
          <h2>Gerenciar Anuncios</h2>
          <button onClick={() => navigate("/addManagement")}>Gerenciar</button>
        </div>
      )}
    </div>
  );
};

export default SideAdSection;
