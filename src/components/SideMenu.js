import "../styles/sideMenu.css";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "./functions/headerFunctions";
import MoonIcon from "../assets/icons/darkModeIcon.js";
import SunIcon from "../assets/icons/lightModeIcon.js";

const SideMenu = ({ closeMenu, isOpen }) => {
  const { currentUser, logout } = useUser();
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`sideMenuOverlay ${isOpen ? "visible" : ""}`}
        onClick={closeMenu}
      ></div>

      <div className={`sideMenu ${isOpen ? "open" : ""}`}>
        <div className="top">
          <div className="profileImageContainer">
            <div
              className="headerProfileImage"
              style={{
                backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`,
              }}
              onClick={() => navigate(`profile/${currentUser._id}`)}
            ></div>
          </div>
          <div onClick={closeMenu} className="closeBtn">Fechar</div>
        </div>

        <div className="scrollableMenuContent">
          <ul className="menuOptions">
            <li onClick={() => navigate("bibleStudies")}>Estudos Bíblico</li>
            <li onClick={() => navigate("privateRooms")}>Salas de Reuniões Privadas</li>
            <li onClick={() => navigate("counselingSessions")}>Sessões de Aconselhamento</li>
            <li onClick={() => navigate("findGathering")}>Encontrar Reunião Próxima</li>
            <li onClick={() => navigate("promotions")}>Promoções</li>
            <li onClick={() => navigate("communityForum")}>Fórum da Comunidade</li>
            <li onClick={() => navigate("guidelines")}>Diretrizes da Plataforma</li>
            <li onClick={() => navigate("suggestions")}>Sugestões</li>
            <li onClick={() => navigate("contactUs")}>Fale Conosco</li>
          </ul>

          {currentUser && (
            <button
              onClick={() => {
                handleLogout(logout, navigate);
                closeMenu();
              }}
              className="logout-button"
            >
              Sair
            </button>
          )}
        </div>

        <div className="bottomFixedTheme">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="themeToggleBtn"
            title={darkMode ? "Modo Claro" : "Modo Escuro"}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
