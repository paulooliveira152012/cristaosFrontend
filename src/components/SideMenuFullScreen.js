import "../styles/components/sideMenuFullScreen.css";
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

const SideMenuFullScreen = () => {
  const { currentUser, logout } = useUser();
  const { darkMode, setDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const thickerIcons = new Set([
    "Diretrizes da Plataforma",
    "Política de Privacidade",
    "Sugestões",
    "Fale Conosco",
    "Termos de Uso",
  ]);

  const iconSize = 22;
  const defaultStroke = 2;
  const thickStroke = 2.6;
  const getStroke = (label) => (thickerIcons.has(label) ? thickStroke : defaultStroke);

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
    <div className="sideMenuFullScreen">
      <div className="topFullScreen">
        <div className="profileImageContainerFullScreen">
          <div
            className="sideMenuProfileImage"
            style={{
              backgroundImage: `url(${
                currentUser?.profileImage || imagePlaceholder
              })`,
            }}
            onClick={() => navigate(`profile/${currentUser?._id}`)}
          />
        </div>
      </div>

      <div className="bottomFullScreen">
        {/* === Itens principais === */}
        <ul className="menuOptionsFullScreen">
          {primaryItems.map(({ label, path, Icon }) => (
            <li key={path} onClick={() => navigate(path)}>
              <Icon size={iconSize} strokeWidth={getStroke(label)} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* === Secundários === */}
        <ul className="secondaryMenuOptionsFullScreen">
          {secondaryItems.map(({ label, path, Icon }) => (
            <li key={path} onClick={() => navigate(path)}>
              <Icon size={iconSize} strokeWidth={getStroke(label)} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* === Administração === */}
        {currentUser?.leader && (
          <ul className="secondaryMenuOptionsFullScreen">
            <li onClick={() => navigate("admin")}>
              <Shield size={iconSize} strokeWidth={2.3} />
              <span>Administração</span>
            </li>
          </ul>
        )}

        {/* === Logout === */}
        {currentUser && (
          <button
            onClick={() => handleLogout(logout, navigate)}
            className="logout-buttonFullScreen"
          >
            Sair
          </button>
        )}

        {/* === Toggle Tema === */}
        <div className="themeToggleBtnFullScreenContainer">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="themeToggleBtnFullScreen"
            aria-label="Alternar tema"
          >
            {darkMode ? (
              <Sun size={22} strokeWidth={2.3} />
            ) : (
              <Moon size={22} strokeWidth={2.3} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideMenuFullScreen;
