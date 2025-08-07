import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { fetchAllAds } from "./functions/addComponentFuncitons.js";
import { useSocket } from "../context/SocketContext.js";
import "../styles/sideAddSection.css";

const advanceIndex = (current, other, total) => {
  if (total <= 2) return current;
  let next = (current + 1) % total;
  if (next === other) next = (next + 1) % total; // evita colisão com o outro slot
  return next;
};

// helper pra garantir dois índices válidos e distintos
const normalizeIndexes = (len, i0, i1) => {
  if (len <= 0) return [];
  if (len === 1) return [0];

  let a = Math.max(0, Math.min(i0 ?? 0, len - 1));
  let b = Math.max(0, Math.min(i1 ?? 1, len - 1));

  if (a === b) b = (a + 1) % len; // garante distintos
  return [a, b];
};

const SideAdSection = () => {
  const [ads, setAds] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState([0, 1]); // mostra 2 anúncios
  const [isHovered, setIsHovered] = useState([false, false]);
  const [fadeClass, setFadeClass] = useState([false, false]);
  const timeoutRefs = useRef([]);
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const socket = useSocket(); // <<< usa o socket do contexto

  // fetch inicial
  useEffect(() => {
    fetchAllAds(setAds);
  }, []);

  // listeners de socket (monta/ desmonta certinho)
  useEffect(() => {
    if (!socket) return;

    const onNew = (ad) => {
      console.log("✅ SideAdSection -> newAdCreated:", ad);
      setAds((prev) => {
        const dedup = prev.filter((x) => String(x._id) !== String(ad._id));
        return [ad, ...dedup];
      });
      // força mostrar o novo ad no slot 0
      setCurrentIndexes(([a, b]) => [0, b === 0 ? a : b ?? 1]);
    };

    const onDeleted = (payload) => {
      const _id = payload?._id || payload;
      setAds((prev) => {
        const next = prev.filter((ad) => String(ad._id) !== String(_id));

        setCurrentIndexes(([i0, i1]) => normalizeIndexes(next.length, i0, i1));
        return next;
      });
    };

    const onUpdated = (updated) => {
      console.log("✏️ SideAdSection -> updatedAd:", updated?._id);
      setAds((prev) => {
        const filtered = prev.filter(
          (ad) => String(ad._id) !== String(updated._id)
        );
        return [updated, ...filtered];
      });
    };

    socket.on("newAdCreated", onNew);
    socket.on("adDeleted", onDeleted); // recomendado padronizar esse nome no back
    socket.on("addDeleted", onDeleted); // fallback se o back ainda estiver usando esse
    socket.on("updatedAd", onUpdated);

    return () => {
      socket.off("newAdCreated", onNew);
      socket.off("adDeleted", onDeleted);
      socket.off("addDeleted", onDeleted);
      socket.off("updatedAd", onUpdated);
    };
  }, [socket]);

  // ajusta slots quando o tamanho muda
  useEffect(() => {
    setCurrentIndexes(([i0, i1]) => normalizeIndexes(ads.length, i0, i1));
  }, [ads.length]);

  // rotação com fade (determinística e sem colisão)
  useEffect(() => {
    if (ads.length <= 2) return;

    const scheduleChange = (slot) => {
      const delay = Math.floor(Math.random() * 2000) + 3000; // 3s–5s
      timeoutRefs.current[slot] = setTimeout(() => {
        if (isHovered[slot]) return scheduleChange(slot);

        setFadeClass((prev) => {
          const arr = [...prev];
          arr[slot] = true;
          return arr;
        });

        setTimeout(() => {
          setCurrentIndexes((prev) => {
            const other = slot === 0 ? 1 : 0;
            const next = [...prev];
            next[slot] = advanceIndex(
              prev[slot] ?? 0,
              prev[other] ?? 1,
              ads.length
            );
            return next;
          });

          setFadeClass((prev) => {
            const arr = [...prev];
            arr[slot] = false;
            return arr;
          });

          scheduleChange(slot);
        }, 500); // duração do fade
      }, delay);
    };

    scheduleChange(0);
    scheduleChange(1);

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [ads.length, isHovered, ads]); // inclui ads pra refletir novos itens

  return (
    <div className="sideAddSection">
      <div className="adsContainer">
        {currentIndexes.map((index, i) => {
          const ad = ads[index];
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
          <h2>Gerenciar Anúncios</h2>
          <button onClick={() => navigate("/addManagement")}>Gerenciar</button>
        </div>
      )}
    </div>
  );
};

export default SideAdSection;
