import { useEffect, useState } from "react";
import "../styles/style.css";
import MenuIcon from "../assets/icons/menuIcon";
import MessageIcon from "../assets/icons/messageIcon";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import { useUser } from "../context/UserContext"; // Ensure correct import
import { Link } from "react-router-dom"; // Correct import for Link
import Plus from "../assets/icons/plusIcon";
import HomeIcon from "../assets/icons/homeIcon";
import BellIcon from "../assets/icons/bellIcon";
import { useNavigate } from "react-router-dom";
import {
  checkForNewNotifications,
  checkForNewMessages,
} from "./functions/footerFunctions";

const Footer = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Destructure currentUser from useUser hook
  const [notifications, setNotifications] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // console.log("Current user in footer component is is:", currentUser)
  // console.log("currentUser.userId in footer component is:", currentUser._id)

  const navigateToMainChat = () => {
    if (currentUser) {
      navigate("/chat");
    } else {
      window.alert("Por favor fazer login para acessar o chat principal");
    }
  };

  useEffect(() => {
    console.log("✅✅✅✅currentUser:", currentUser);

    if (!currentUser) {
      console.log("no current user...");
      return;
    }

    console.log(
      `checking for new notifications for ${currentUser?.username}...`
    );

    const timeout = setTimeout(() => {
      checkForNewNotifications(setNotifications);
      checkForNewMessages(setUnreadMessagesCount, currentUser._id);

    }, 1000); // espera 1 segundo

    return () => clearTimeout(timeout); // boa prática: limpa timeout se componente desmontar
  }, [currentUser]);

  console.log("unreadMessagesCount:", unreadMessagesCount)

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        <HomeIcon />
      </Link>

      {/* <MenuIcon /> */}
      <div
        className="notificationIcon"
        onClick={navigateToMainChat}
        style={{ position: "relative" }}
      >
        <MessageIcon />
        {unreadMessagesCount > 0 && (
          <span className="notificationCount">{unreadMessagesCount}</span>
        )}
      </div>

      {/* conditionally render Plus button */}
      {currentUser && (
        <Link to="/newlisting">
          <Plus />
        </Link>
      )}

      {notifications && (
        <div className="notificationIcon">
          <Link to="/notifications">
            <BellIcon />
            <span className="notificationStatus"></span>
          </Link>
        </div>
      )}

      {!notifications && (
        <div className="BellIcon">
          <Link to="/notifications">
            <BellIcon />
          </Link>
        </div>
      )}

      {/* <div
                className='footerProfileImage'
                style={{
                    backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`, // Use profile image or fallback image
                    backgroundPosition: 'center'
                }}
                onClick={() => navigate(`profile/${currentUser._id}`)}
            ></div> */}
    </div>
  );
};

export default Footer;
