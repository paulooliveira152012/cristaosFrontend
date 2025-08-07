import React from "react";
import { useState, useEffect } from "react";
import "../styles/adManagement.css";
import Header from "../components/Header";
import { getAds } from "../components/functions/addManagementFuncitons";
import { useNavigate } from "react-router-dom";

const ViewAds = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAds()
      .then(setAds)
      .catch(() => setError("Erro ao carregar anúncios."))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <Header
        showBackArrow={true}
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
                  <strong>{ad.title}</strong> - {ad.description} <br />
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
