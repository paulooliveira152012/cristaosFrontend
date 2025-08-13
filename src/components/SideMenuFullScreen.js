import "../styles/components/sideMenuFullScreen.css";
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
            onClick={() => navigate(`profile/${currentUser?._id}`)}
          />
        </div>
      </div>

      <div className="bottomFullScreen">
        {/* === Itens principais (igual ao SideMenu) === */}
        <ul className="menuOptionsFullScreen">
          <li onClick={() => navigate("bibleStudies")}>Estudos Bíblico</li>
          <li onClick={() => navigate("privateRooms")}>Salas de Reuniões Privadas</li>
          <li onClick={() => navigate("counselingSessions")}>Sessões de Aconselhamento</li>
          <li onClick={() => navigate("findGathering")}>Encontrar Reunião Próxima</li>
          <li onClick={() => navigate("promotions")}>Promoções</li>
          <li onClick={() => navigate("communityForum")}>Fórum da Comunidade</li>
        </ul>

        {/* === Secundários (igual ao SideMenu) === */}
        <ul className="secondaryMenuOptionsFullScreen">
          <li onClick={() => navigate("guidelines")}>Diretrizes da Plataforma</li>
          <li onClick={() => navigate("privacyPolicy")}>Política de Privacidade</li>
          <li onClick={() => navigate("suggestions")}>Sugestões</li>
          <li onClick={() => navigate("contactUs")}>Fale Conosco</li>
          <li onClick={() => navigate("termsOfUse")}>Termos de Uso</li>
          <li onClick={() => navigate("globe")}>Igrejas Registradas</li>
        </ul>

        {/* === Administração (3ª seção como no SideMenu) === */}
        <ul className="secondaryMenuOptionsFullScreen">
          <li onClick={() => navigate("admin")}>Administração</li>
        </ul>

        {/* === Logout (igual ao SideMenu) === */}
        {currentUser && (
          <button
            onClick={() => handleLogout(logout, navigate)}
            className="logout-buttonFullScreen"
          >
            Sair
          </button>
        )}

        {/* === Toggle de Tema no rodapé === */}
        <div className="themeToggleBtnFullScreenContainer">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="themeToggleBtnFullScreen"
            aria-label="Alternar tema"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideMenuFullScreen;
