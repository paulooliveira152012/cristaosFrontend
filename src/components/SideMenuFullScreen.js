import "../styles/sideMenuFullScreen.css";
import { useUser } from "../context/UserContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";

const SideMenuFullScreen = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  return (
      <div className="sideMenuFullScreen">
        <div className="top">
          {/* Display the user's profile image */}
          <div className="profileImageContainer">
            <div
              className="sideMenuProfileImage"
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
          </ul>
        </div>
      </div>
    
  );
};

export default SideMenuFullScreen;
