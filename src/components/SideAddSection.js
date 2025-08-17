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
  const { socket } = useSocket(); // ✅ desestruturado
  const [ads, setAds] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState(
    Array.from({ length: SLOTS }, (_, i) => i)
  );
  const [isHovered, setIsHovered] = useState(Array(SLOTS).fill(false));
  const [fadeClass, setFadeClass] = useState(Array(SLOTS).fill(false));
  const timeoutRefs = useRef([]);
  const { currentUser } = useUser();
  const navigate = useNavigate();

  // fetch inicial
  useEffect(() => {
    fetchAllAds(setAds);
  }, []);

  // listeners de socket (create/update/delete)
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const onNew = (ad) => {
      // insere no topo e já normaliza índices com o NOVO array
      setAds((prev) => {
        const dedup = prev.filter((x) => String(x._id) !== String(ad._id));
        const newAds = [ad, ...dedup];

        // força mostrar o novo ad no slot 0
        setCurrentIndexes((prevIdxs) => {
          const nextIdxs = [...prevIdxs];
          nextIdxs[0] = 0; // novo ficou no índice 0
          return normalizeIndexesMany(newAds.length, nextIdxs);
        });

        return newAds;
      });
    };

    const onDeleted = (payload) => {
      const _id = payload?._id || payload;
      setAds((prev) => {
        const next = prev.filter((ad) => String(ad._id) !== String(_id));
        setCurrentIndexes((prevIdxs) => normalizeIndexesMany(next.length, prevIdxs));
        return next;
      });
    };

    const onUpdated = (updated) => {
      setAds((prev) => {
        const filtered = prev.filter((ad) => String(ad._id) !== String(updated._id));
        const newAds = [updated, ...filtered];
        // opcional: manter slot 0 no atualizado se você quiser destacar
        setCurrentIndexes((prevIdxs) => normalizeIndexesMany(newAds.length, prevIdxs));
        return newAds;
      });
    };

    socket.on("newAdCreated", onNew);
    socket.on("adDeleted", onDeleted);
    socket.on("addDeleted", onDeleted); // fallback/typo compat
    socket.on("updatedAd", onUpdated);

    return () => {
      socket.off("newAdCreated", onNew);
      socket.off("adDeleted", onDeleted);
      socket.off("addDeleted", onDeleted);
      socket.off("updatedAd", onUpdated);
    };
  }, [socket]);

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
          setCurrentIndexes((prevIdxs) => {
            const used = new Set(prevIdxs.filter((_, i) => i !== slot));
            let cand = ((prevIdxs[slot] ?? 0) + 1) % ads.length;
            let tries = 0;
            while (used.has(cand) && tries < ads.length) {
              cand = (cand + 1) % ads.length;
              tries++;
            }
            const next = [...prevIdxs];
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
                onClick={(e) => e.stopPropagation()} // evita navegar e abrir link ao mesmo tempo
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

        {/* Se o controle de permissão for por role, considere trocar por role === 'lider' */}
        {currentUser?.role === 'leader' && (
          <div className="addSectionHeader">
            <h2>Gerenciar Anúncios</h2>
            <button onClick={() => navigate("/addManagement")}>Gerenciar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideAdSection;
