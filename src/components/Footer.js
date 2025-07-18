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
import { checkForNewNotifications } from "./functions/footerFunctions";

const Footer = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Destructure currentUser from useUser hook
  const [notifications, setNotifications] = useState(false)
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
    console.log("✅✅✅✅currentUser:", currentUser)

    if (!currentUser) {
      console.log("no current user...");
      return;
    }


    console.log(
      `checking for new notifications for ${currentUser?.username}...`
    );
    checkForNewNotifications(setNotifications);
  }, [currentUser]);

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        <HomeIcon />
      </Link>

      {/* <MenuIcon /> */}
      <div onClick={navigateToMainChat}>
        <MessageIcon />
      </div>

      {/* conditionally render Plus button */}
      {currentUser && (
        <Link to="/newlisting">
          <Plus />
        </Link>
      )}

      {notifications && (
      <div className="BellIcon">
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
