import React from "react";
import "../styles/adManagement.css";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const DeleteAd = () => {
    const navigate = useNavigate();

  return (
    <>
    <Header
            showBackArrow={true}
            showProfileImage={false}
            onBack={() => navigate(-1)}
          />
    
    <div className="adManagementWrapper">
      <h2 className="adManagementTitle">Excluir Anúncio</h2>
      <form className="adForm">
        <label>Selecione o anúncio para excluir:</label>
        <select className="adInput">
          <option value="">Selecione...</option>
          {/* opções dinâmicas */}
        </select>
        <button type="submit" className="adManagementButton delete">
          Excluir
        </button>
      </form>
    </div>
    </>
  );
};

export default DeleteAd;
