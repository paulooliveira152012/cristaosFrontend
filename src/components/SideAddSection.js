import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { fetchAllAds } from "./functions/addComponentFuncitons.js";
import { useSocket } from "../context/SocketContext.js";
import "../styles/sideAddSection.css";

// ===== CONFIG =====
const SLOTS = 3; // quantos anúncios simultâneos exibir

// Garante N índices válidos e distintos
const normalizeIndexesMany = (len, idxs) => {
  if (len <= 0) return [];
  if (len === 1) return [0];

  const out = [];
  for (let i = 0; i < Math.min(SLOTS, len); i++) {
    let base = idxs?.[i] ?? i;
    let cand = Math.max(0, Math.min(base, len - 1));
    let tries = 0;
    while (out.includes(cand) && tries < len) {
      cand = (cand + 1) % len;
      tries++;
    }
    out.push(cand);
  }
  return out;
};

const SideAdSection = () => {
  const [ads, setAds] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState(
    Array.from({ length: SLOTS }, (_, i) => i)
  );
  const [isHovered, setIsHovered] = useState(Array(SLOTS).fill(false));
  const [fadeClass, setFadeClass] = useState(Array(SLOTS).fill(false));
  const timeoutRefs = useRef([]);
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const socket = useSocket();

  // fetch inicial
  useEffect(() => {
    fetchAllAds(setAds);
  }, []);

  // listeners de socket
  useEffect(() => {
    if (!socket) return;

    const onNew = (ad) => {
      console.log("✅ SideAdSection -> newAdCreated:", ad);
      setAds((prev) => {
        const dedup = prev.filter((x) => String(x._id) !== String(ad._id));
        return [ad, ...dedup];
      });
      // força mostrar o novo ad no slot 0
      setCurrentIndexes((prev) => {
        const next = [...prev];
        next[0] = 0; // como o novo entrou no início, índice 0 aponta pra ele
        return normalizeIndexesMany(Math.max(ads.length + 1, 1), next);
      });
    };

    const onDeleted = (payload) => {
      const _id = payload?._id || payload;
      setAds((prev) => {
        const next = prev.filter((ad) => String(ad._id) !== String(_id));
        setCurrentIndexes((prevIdxs) =>
          normalizeIndexesMany(next.length, prevIdxs)
        );
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
    socket.on("adDeleted", onDeleted);
    socket.on("addDeleted", onDeleted); // fallback
    socket.on("updatedAd", onUpdated);

    return () => {
      socket.off("newAdCreated", onNew);
      socket.off("adDeleted", onDeleted);
      socket.off("addDeleted", onDeleted);
      socket.off("updatedAd", onUpdated);
    };
  }, [socket, ads.length]);

  // quando mudar o tamanho da lista, normalize os índices
  useEffect(() => {
    setCurrentIndexes((prev) => normalizeIndexesMany(ads.length, prev));
  }, [ads.length]);

  // rotação com fade (sem colisão entre slots)
  useEffect(() => {
    if (ads.length <= SLOTS) return;

    const scheduleChange = (slot) => {
      const delay = Math.floor(Math.random() * 2000) + 3000; // 3–5s
      timeoutRefs.current[slot] = setTimeout(() => {
        if (isHovered[slot]) return scheduleChange(slot);

        setFadeClass((prev) => {
          const arr = [...prev];
          arr[slot] = true;
          return arr;
        });

        setTimeout(() => {
          setCurrentIndexes((prev) => {
            const used = new Set(prev.filter((_, i) => i !== slot));
            let cand = ((prev[slot] ?? 0) + 1) % ads.length;
            let tries = 0;
            while (used.has(cand) && tries < ads.length) {
              cand = (cand + 1) % ads.length;
              tries++;
            }
            const next = [...prev];
            next[slot] = cand;
            return next;
          });

          setFadeClass((prev) => {
            const arr = [...prev];
            arr[slot] = false;
            return arr;
          });

          scheduleChange(slot);
        }, 500);
      }, delay);
    };

    for (let s = 0; s < Math.min(SLOTS, ads.length); s++) {
      scheduleChange(s);
    }
    return () => timeoutRefs.current.forEach(clearTimeout);
  }, [ads, isHovered]);

  return (
    <div className="sideAddSection">
      <div className="adsContainer">
        {currentIndexes.map((index, i) => {
          const ad = ads[index];
          if (!ad) return null;

          return (
            <div
              key={`${ad._id}-${i}`} // chave por slot pra evitar reuse estranho durante rotação
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
        {currentUser?.leader && (
          <div className="addSectionHeader">
            <h2>Gerenciar Anúncios</h2>
            <button onClick={() => navigate("/addManagement")}>
              Gerenciar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideAdSection;
