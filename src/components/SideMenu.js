import "../styles/sideMenu.css";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "./functions/headerFunctions";

const SideMenu = ({ closeMenu }) => {
  const { currentUser, logout } = useUser();
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <div>
      <div className="modal" style={{ zIndex: 1, height: "100%" }}></div>
      <div className="sideMenu">
        <div className="top">
          <div className="profileImageContainer">
            <div
              className="headerProfileImage"
              style={{
                backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`,
                backgroundPosition: "center",
              }}
              onClick={() => navigate(`profile/${currentUser._id}`)}
            ></div>
          </div>
          <div onClick={closeMenu} className="closeBtn">Close</div>
        </div>

        <div className="bottom">
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

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="themeToggleBtn"
              style={{
                padding: "10px",
                backgroundColor: "transparent",
                border: "1px solid currentColor",
                borderRadius: "8px",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              {darkMode ? "☀️ Tema Claro" : "🌙 Tema Escuro"}
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  handleLogout(logout, navigate);
                  closeMenu();
                }}
                className="logout-button"
                style={{
                  padding: "10px",
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
