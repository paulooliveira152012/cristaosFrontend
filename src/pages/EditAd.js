import React from "react";
import { useState } from "react";
import "../styles/adManagement.css";
import Header from "../components/Header";
import { editAd, getAds } from "../components/functions/addManagementFuncitons";
import { useNavigate } from "react-router-dom";

const EditAd = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    getAds().then(setAds);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await editAd(selectedId, form);
      navigate("/ads/view");
    } catch (err) {
      setError("Erro ao editar anúncio.");
    } finally {
      setLoading(false);
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
        <h2 className="adManagementTitle">Editar Anúncio</h2>
        <form className="adForm" onSubmit={handleSubmit}>
          <label>Selecione o anúncio:</label>
          <select
            className="adInput"
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
          <label>Novo Título:</label>
          <input
            type="text"
            name="title"
            className="adInput"
            value={form.title}
            onChange={handleChange}
          />
          <label>Nova Descrição:</label>
          <textarea
            name="description"
            className="adInput"
            value={form.description}
            onChange={handleChange}
          />
          <label>Novo Link:</label>
          <input
            type="text"
            name="link"
            className="adInput"
            value={form.link}
            onChange={handleChange}
          />
          <label>Nova Imagem:</label>
          <input
            type="file"
            name="image"
            className="adInput"
            onChange={handleChange}
          />
          <button
            type="submit"
            className="adManagementButton edit"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
          {error && <p className="errorMsg">{error}</p>}
        </form>

        {/* Exibe o anúncio atual selecionado */}
        {selectedId &&
          (() => {
            const ad = ads.find((a) => a._id === selectedId);
            if (!ad) return null;
            return (
              <div className="adList" style={{ marginTop: 20 }}>
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
              </div>
            );
          })()}
      </div>
    </>
  );
};

export default EditAd;
