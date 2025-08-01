// primeira pagina do aplicativo
/*
contem:
    Salas de live abertas
    Pessoas online
    listagens publicas de usuarios 
    footer com icone de menu, chat de texto, foto de usuario
    (nao tendo usuario, tera botao de fazer login)
*/

// importar estilo css devido aos seletores globais
import "../styles/style.css";
// importar capacidade de navegacao
import { useNavigate, Link } from "react-router-dom";
// import components
import Salas from "../components/Salas";
import Liveusers from "../components/Liveusers";
import Footer from "../components/Footer";
import Listings from "../components/Listings";
import Header from "../components/Header";
import { useRoom } from "../context/RoomContext";
import SupportUs from "../components/SupportUs";
import NewListing from "../components/Listing";


// declarar o componente
const Landing = () => {
  const navigate = useNavigate();
  const { minimizedRoom } = useRoom(); // Access the minimized room from context

  return (
    // container que engloba todo o componente
<div className="landingContainer">
      <Header 
        showBackButton={false} 
        showBackArrow={false} 
        showLeaveButton={false} 
        showCloseIcon={false}
        navigate={navigate}
        />
      <SupportUs />
      <Salas />
      <Liveusers />
      <Listings />
    </div>
  );
};

// exportar o componente
export default Landing;
