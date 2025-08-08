import React from "react";
import { useState } from "react";
import Header from "../components/Header";
import { addAd } from "../components/functions/addManagementFuncitons";
import { useNavigate } from "react-router-dom";
import "../styles/adManagement.css";
import { useUser } from "../context/UserContext";

const AddAd = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    image: null,
    createdBy: currentUser._id,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await addAd({ adData: form});
      navigate("/ads/view");
    } catch (err) {
      setError("Erro ao adicionar anúncio.");
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
        <h2 className="adManagementTitle">Adicionar Anúncio</h2>
        <form className="adForm" onSubmit={handleSubmit}>
          <label>Título:</label>
          <input
            type="text"
            name="title"
            className="adInput"
            value={form.title}
            onChange={handleChange}
          />
          <label>Descrição:</label>
          <textarea
            name="description"
            className="adInput"
            value={form.description}
            onChange={handleChange}
          />
          <label>Link:</label>
          <input
            type="text"
            name="link"
            className="adInput"
            value={form.link}
            onChange={handleChange}
          />
          <label>Imagem:</label>
          <input
            type="file"
            name="image"
            className="adInput"
            onChange={handleChange}
          />
          <button
            type="submit"
            className="adManagementButton add"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
          {error && <p className="errorMsg">{error}</p>}
        </form>
      </div>
    </>
  );
};

export default AddAd;
