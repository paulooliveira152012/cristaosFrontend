import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "../styles/style.css";

import MessageIcon from "../assets/icons/messageIcon";
import MessageIconSolid from "../assets/icons/messageIconSolid.js";

import HomeIcon from "../assets/icons/homeIcon";
import HomeIconSolid from "../assets/icons/homeIconSolid";

import PlusIcon from "../assets/icons/plusIcon";
import PlusIconSolid from "../assets/icons/plusIconSolid";

import BellIcon from "../assets/icons/bellIcon";
import BellIconSolid from "../assets/icons/bellIconSolid";

import {
  checkForNewNotifications,
  checkForNewMessages,
} from "./functions/footerFunctions";

import { useUser } from "../context/UserContext";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
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
    if (!currentUser) return;

    const timeout = setTimeout(() => {
      checkForNewNotifications(setNotifications);
      checkForNewMessages(setUnreadMessagesCount, currentUser._id);
    }, 1000); // espera 1 segundo

    return () => clearTimeout(timeout); // boa prática: limpa timeout se componente desmontar
  }, [currentUser]);

  console.log("unreadMessagesCount:", unreadMessagesCount);

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        {location.pathname === "/" ? <HomeIconSolid /> : <HomeIcon />}
      </Link>

      <div className="notificationIcon" onClick={navigateToMainChat}>
        {location.pathname === "/chat" ? <MessageIconSolid /> : <MessageIcon />}
        {unreadMessagesCount > 0 && (
          <span className="notificationStatus">{unreadMessagesCount}</span>
        )}
      </div>

      {currentUser && (
        <Link to="/newlisting">
          {location.pathname === "/newlisting" ? (
            <PlusIconSolid />
          ) : (
            <PlusIcon />
          )}
        </Link>
      )}

      <div className="notificationIcon">
        <Link to="/notifications">
          {location.pathname === "/notifications" ? (
            <BellIconSolid />
          ) : (
            <BellIcon />
          )}
          {notifications && <span className="notificationStatus"></span>}
        </Link>
      </div>
    </div>
  );
};

export default Footer;
