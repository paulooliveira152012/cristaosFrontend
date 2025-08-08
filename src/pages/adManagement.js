import React from "react";
import Header from "../components/Header";
// import { addAd, editAd, deleteAd, getAds } from "../components/functions/addManagementFuncitons";
import { useNavigate } from "react-router-dom";
import "../styles/adManagement.css";

const AdManagement = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header
        showBackArrow={true}
        showProfileImage={false}
        onBack={() => navigate(-1)}
      />
      <div className="adManagementWrapper">
        <h2 className="adManagementTitle">Gerenciamento de Anúncios</h2>
        <div className="adManagementButtonGroup">
          <button
            className="adManagementButton add"
            onClick={() => navigate("/ads/add")}
          >
            Adicionar Anúncio
          </button>
          <button
            className="adManagementButton edit"
            onClick={() => navigate("/ads/edit")}
          >
            Editar Anúncio
          </button>
          <button
            className="adManagementButton delete"
            onClick={() => navigate("/ads/delete")}
          >
            Excluir Anúncio
          </button>
          <button
            className="adManagementButton view"
            onClick={() => navigate("/ads/view")}
          >
            Visualizar Anúncios
          </button>
        </div>
        <div className="adManagementSection">
          <h3>Instruções:</h3>
          <ul className="adManagementList">
            <li>Use os botões acima para gerenciar seus anúncios.</li>
            <li>Clique em "Adicionar Anúncio" para criar um novo anúncio.</li>
            <li>Para editar ou excluir, selecione o anúncio desejado.</li>
            <li>
              Visualize todos os anúncios ativos em "Visualizar Anúncios".
            </li>
          </ul>
        </div>
        <div className="adManagementSection">
          <h3>Notas:</h3>
          <ul className="adManagementList">
            <li>
              Certifique-se de que você tem as permissões necessárias para
              gerenciar anúncios.
            </li>
            <li>Todos os anúncios devem seguir as diretrizes da plataforma.</li>
            <li>
              Para mais informações, consulte a documentação ou entre em contato
              com o suporte.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default AdManagement;
