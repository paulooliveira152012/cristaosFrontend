import "../styles/components/sideMenu.css";

import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "./functions/headerFunctions";

import {
  Moon, Sun,
  BookOpen, Layers, Users, MessageSquare, MapPin, Tag, Globe,
  FileText, Lock, Edit3, Phone, Settings, Shield
} from "lucide-react";

const SideMenu = ({ closeMenu, isOpen }) => {
  const { currentUser, logout } = useUser();
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  // Ícones que precisam de traço mais grosso (ajuste fino por label)
  const thickerIcons = new Set([
    "Diretrizes da Plataforma",
    "Política de Privacidade",
    "Sugestões",
    "Fale Conosco",
    "Termos de Uso",
  ]);

  const iconSize = 20;
  const getStroke = (label) => (thickerIcons.has(label) ? 2.5 : 2);

  const primaryItems = [
    { label: "Mapa", path: "globe", Icon: Globe },
    { label: "Estudos por livros", path: "bibleStudiesBook", Icon: BookOpen },
    { label: "Estudos por temas", path: "bibleStudiesTheme", Icon: Layers },
    { label: "Reuniões Privadas", path: "privateRooms", Icon: Users },
    { label: "Aconselhamento", path: "counselingSessions", Icon: MessageSquare },
    { label: "Encontrar reunião próxima", path: "findGathering", Icon: MapPin },
    { label: "Promoções", path: "promotions", Icon: Tag },
    { label: "Fórum da comunidade", path: "communityForum", Icon: Globe },
  ];

  const secondaryItems = [
    { label: "Diretrizes da Plataforma", path: "guidelines", Icon: FileText },
    { label: "Política de Privacidade", path: "privacyPolicy", Icon: Lock },
    { label: "Sugestões", path: "suggestions", Icon: Edit3 },
    { label: "Fale Conosco", path: "contactUs", Icon: Phone },
    { label: "Termos de Uso", path: "termsOfUse", Icon: Settings },
  ];

  return (
    <>
      <div
        className={`sideMenuOverlay ${isOpen ? "visible" : ""}`}
        onClick={closeMenu}
      />

      <div className={`sideMenu ${isOpen ? "open" : ""}`}>
        <div className="top">
          <div className="topRight">
            <div className="profileImageContainer">
              <div
                className="headerProfileImage"
                style={{
                  backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`,
                }}
                onClick={() => {
                  if (currentUser?._id) navigate(`profile/${currentUser._id}`);
                }}
              />
            </div>

            <button
              className="viewProfileButton"
              onClick={() => {
                if (currentUser?._id) navigate(`profile/${currentUser._id}`);
                closeMenu();
              }}
            >
              Ver Perfil
            </button>
          </div>
        </div>

        <div className="scrollableMenuContent">
          <ul className="menuOptions">
            {primaryItems.map(({ label, path, Icon }) => (
              <li key={path} onClick={() => navigate(path)}>
                <Icon size={iconSize} strokeWidth={getStroke(label)} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <ul className="secondaryMenuOptions">
            {secondaryItems.map(({ label, path, Icon }) => (
              <li key={path} onClick={() => navigate(path)}>
                <Icon size={iconSize} strokeWidth={getStroke(label)} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {currentUser?.leader && (
            <ul className="secondaryMenuOptions">
              <li onClick={() => navigate("admin")}>
                <Shield size={iconSize} strokeWidth={2.3} aria-hidden="true" />
                <span>Administração</span>
              </li>
            </ul>
          )}

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
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? <Sun size={20} strokeWidth={2.3} /> : <Moon size={20} strokeWidth={2.3} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
