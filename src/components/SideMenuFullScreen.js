import "../styles/sideMenuFullScreen.css";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "./functions/headerFunctions";

const SideMenuFullScreen = () => {
  const { currentUser, logout } = useUser();
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <div className="sideMenuFullScreen">
      <div className="topFullScreen">
        <div className="profileImageContainerFullScreen">
          <div
            className="sideMenuProfileImage"
            style={{
              backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`,
              backgroundPosition: "center",
            }}
            onClick={() => navigate(`profile/${currentUser._id}`)}
          ></div>
        </div>
      </div>

      <div className="bottomFullScreen">
        <ul className="menuOptionsFullScreen">
          <li onClick={() => navigate("bibleStudies")}>Estudos Bíblico</li>
          <li onClick={() => navigate("privateRooms")}>Salas de Reuniões Privadas</li>
          <li onClick={() => navigate("counselingSessions")}>Sessões de Aconselhamento</li>
          <li onClick={() => navigate("findGathering")}>Encontrar Reunião Próxima</li>
          <li onClick={() => navigate("promotions")}>Promoções</li>
          <li onClick={() => navigate("communityForum")}>Fórum da Comunidade</li>
          <li onClick={() => navigate("guidelines")}>Diretrizes da Plataforma</li>
          <li onClick={() => navigate("suggestions")}>Sugestões</li>
          <li onClick={() => navigate("contactUs")}>Fale Conosco</li>

          {currentUser && (
            <li
              onClick={() => handleLogout(logout, navigate)}
              className="logout-buttonFullScreen"
              style={{ color: "red", fontWeight: "bold" }}
            >
              Logout
            </li>
          )}
        </ul>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="themeToggleBtnFullScreen"
          style={{
            marginTop: "20px",
            padding: "10px",
            width: "90%",
            alignSelf: "center",
            backgroundColor: "transparent",
            border: "1px solid currentColor",
            borderRadius: "8px",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          {darkMode ? "☀️ Tema Claro" : "🌙 Tema Escuro"}
        </button>
      </div>
    </div>
  );
};

export default SideMenuFullScreen;
