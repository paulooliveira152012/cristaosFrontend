import "../styles/sideMenuFullScreen.css";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "./functions/headerFunctions";
import MoonIcon from "../assets/icons/darkModeIcon";
import SunIcon from "../assets/icons/lightModeIcon";

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
            >
              Logout
            </li>
          )}
        </ul>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="themeToggleBtnFullScreen"
          aria-label="Alternar tema"
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  );
};

export default SideMenuFullScreen;
