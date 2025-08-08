import React from "react";
import "../styles/adManagement.css";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import {
  getAds,
  deleteAd,
} from "../components/functions/addManagementFuncitons";

const DeleteAd = () => {
  const navigate = useNavigate();
  const [ads, setAds] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");

  React.useEffect(() => {
    getAds().then(setAds);
  }, []);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await deleteAd(selectedId);
      setAds(ads.filter((ad) => ad._id !== selectedId));
      navigate("/ads/view");
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
    }
  };

  return (
    <>
      <Header
        showBackArrow={true}
        showProfileImage={false}
        onBack={() => navigate(-1)}
      />
      <div className="adManagementWrapper">
        <h2 className="adManagementTitle">Excluir Anúncio</h2>
        <form className="adForm" onSubmit={handleDelete}>
          <label>Selecione o anúncio para excluir:</label>
          <select
            className="adInput"
            name="adId"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {ads.map((ad) => (
              <option key={ad._id} value={ad._id}>
                {ad.title}
              </option>
            ))}
          </select>
          <button type="submit" className="adManagementButton delete">
            Excluir
          </button>
        </form>

        {/* Detalhes do anúncio selecionado */}
        {selectedId && (
          <div className="adList" style={{ marginTop: 20 }}>
            {(() => {
              const ad = ads.find((a) => a._id === selectedId);
              if (!ad) return null;
              return (
                <ul>
                  <li>
                    <strong>{ad.title}</strong> - {ad.description} <br />
                    {ad.link && (
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
                </ul>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
};

export default DeleteAd;
