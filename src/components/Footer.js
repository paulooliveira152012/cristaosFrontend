import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "../styles/style.css";

import MenuIcon from "../assets/icons/menuIcon";
import MessageIcon from "../assets/icons/messageIcon";
import MessageIconSolid from "../assets/icons/messageIconSolid";

import HomeIcon from "../assets/icons/homeIcon";
import HomeIconSolid from "../assets/icons/homeIconSolid";

import PlusIcon from "../assets/icons/plusIcon";
import PlusIconSolid from "../assets/icons/plusIconSolid";

import BellIcon from "../assets/icons/bellIcon";
import BellIconSolid from "../assets/icons/bellIconSolid";

import { useUser } from "../context/UserContext";
import { checkForNewNotifications } from "./functions/footerFunctions";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState(false);

  const navigateToMainChat = () => {
    if (currentUser) {
      navigate("/chat");
    } else {
      window.alert("Por favor fazer login para acessar o chat principal");
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const timeout = setTimeout(() => {
      checkForNewNotifications(setNotifications);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [currentUser]);

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        {location.pathname === "/" ? <HomeIconSolid /> : <HomeIcon />}
      </Link>

      <div onClick={navigateToMainChat}>
        {location.pathname === "/chat" ? <MessageIconSolid /> : <MessageIcon />}
      </div>

      {currentUser && (
        <Link to="/newlisting">
          {location.pathname === "/newlisting" ? <PlusIconSolid /> : <PlusIcon />}
        </Link>
      )}

      <div className="BellIcon">
        <Link to="/notifications">
          {location.pathname === "/notifications" ? <BellIconSolid /> : <BellIcon />}
          {notifications && <span className="notificationStatus"></span>}
        </Link>
      </div>
    </div>
  );
};

export default Footer;
