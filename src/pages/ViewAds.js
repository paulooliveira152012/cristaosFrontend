import React, { useState, useEffect } from "react";
import "../styles/adManagement.css";
import Header from "../components/Header";
import { getAds } from "../components/functions/addManagementFuncitons";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const ViewAds = () => {
  const { socket } = useSocket();               // ✅ pega { socket }
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carregar lista inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAds();
        if (mounted) setAds(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setError("Erro ao carregar anúncios.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Assinar atualizações via socket
  useEffect(() => {
    if (!socket) return;

    const onNew = (ad) => {
      setAds((prev) => {
        // evita duplicata
        const next = prev.filter((x) => String(x._id) !== String(ad._id));
        return [ad, ...next];
      });
    };

    const onDeleted = (payload) => {
      const id = payload?._id || payload;
      setAds((prev) => prev.filter((ad) => String(ad._id) !== String(id)));
    };

    const onUpdated = (updated) => {
      setAds((prev) => {
        const others = prev.filter((x) => String(x._id) !== String(updated._id));
        return [updated, ...others];
      });
    };

    socket.on("newAdCreated", onNew);
    socket.on("adDeleted", onDeleted);
    socket.on("addDeleted", onDeleted);   // fallback legado, se existir
    socket.on("updatedAd", onUpdated);

    return () => {
      socket.off("newAdCreated", onNew);
      socket.off("adDeleted", onDeleted);
      socket.off("addDeleted", onDeleted);
      socket.off("updatedAd", onUpdated);
    };
  }, [socket]);

  return (
    <>
      <Header
        showBackArrow
        showProfileImage={false}
        onBack={() => navigate(-1)}
      />

      <div className="adManagementWrapper">
        <h2 className="adManagementTitle">Visualizar Anúncios</h2>

        <div className="adList">
          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p className="errorMsg">{error}</p>
          ) : ads.length === 0 ? (
            <p>Nenhum anúncio cadastrado.</p>
          ) : (
            <ul>
              {ads.map((ad) => (
                <li key={ad._id}>
                  <strong>{ad.title}</strong> - {ad.description}
                  <br />
                  {ad.link && (
                    <a href={ad.link} target="_blank" rel="noopener noreferrer">
                      {ad.link}
                    </a>
                  )}
                  <br />
                  {ad.imageUrl && (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      style={{ maxWidth: 200 }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewAds;
