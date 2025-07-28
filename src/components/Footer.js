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
    }, 1000);

    return () => clearTimeout(timeout);
  }, [currentUser]);

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        {location.pathname === "/" ? (
          <HomeIconSolid className="icon" />
        ) : (
          <HomeIcon className="icon" />
        )}
      </Link>

      <div className="notificationIcon" onClick={navigateToMainChat}>
        {location.pathname === "/chat" ? (
          <MessageIconSolid className="icon" />
        ) : (
          <MessageIcon className="icon" />
        )}
        {unreadMessagesCount > 0 && (
          <span className="notificationStatus">{unreadMessagesCount}</span>
        )}
      </div>

      {currentUser && (
        <Link to="/newlisting">
          {location.pathname === "/newlisting" ? (
            <PlusIconSolid className="icon" />
          ) : (
            <PlusIcon className="icon" />
          )}
        </Link>
      )}

      <div className="notificationIcon">
        <Link to="/notifications">
          {location.pathname === "/notifications" ? (
            <BellIconSolid className="icon" />
          ) : (
            <BellIcon className="icon" />
          )}
          {notifications && <span className="notificationStatus"></span>}
        </Link>
      </div>
    </div>
  );
};

export default Footer;
