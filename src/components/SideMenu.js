import "../styles/sideMenu.css";
import { useUser } from "../context/UserContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";
import CloseIcon from "../assets/icons/closeIcon";
// importar funcao de logout
import { handleLogout } from "./functions/headerFunctions";

let logout;

const SideMenu = ({ closeMenu }) => {
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="modal"
        style={{
          zIndex: 1,
          height: "100%",
        }}
      ></div>
      <div className="sideMenu">
        <div className="top">
          {/* Display the user's profile image */}
          <div className="profileImageContainer">
            <div
              className="headerProfileImage"
              style={{
                backgroundImage: `url(${
                  currentUser?.profileImage || imagePlaceholder
                })`,
                backgroundPosition: "center",
                //   margin: "5px 20px",
                //   float: "left",
              }}
              alt="Profile"
              onClick={() => navigate(`profile/${currentUser._id}`)}
            ></div>
            {/* display current user's name */}
            {/* <p className="username">{currentUser?.username}</p> */}
          </div>

          <div onClick={closeMenu} className="closeBtn">
            Close 
          </div>
        </div>

        {/* Navigation options for the platform */}
        <div className="bottom">
          <ul className="menuOptions">
            <li onClick={() => navigate("bibleStudies")}>Estudos Bíblico</li>
            <li onClick={() => navigate("privateRooms")}>
              Salas de Reuniões Privadas
            </li>
            <li onClick={() => navigate("counselingSessions")}>
              Sessões de Aconselhamento
            </li>
            <li onClick={() => navigate("findGathering")}>
              Encontrar Reunião Próxima
            </li>
            <li onClick={() => navigate("promotions")}>Promoções</li>
            <li onClick={() => navigate("communityForum")}>
              Fórum da Comunidade
            </li>
            <li onClick={() => navigate("guidelines")}>
              Diretrizes da Plataforma
            </li>
            <li onClick={() => navigate("suggestions")}>Sugestões</li>
            <li onClick={() => navigate("contactUs")}>Fale Conosco</li>

            {currentUser && (
              <button
                onClick={() => {
                  handleLogout(logout, navigate)
                  closeMenu()
                } }
                className="logout-button"
              >
                Logout
              </button>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
