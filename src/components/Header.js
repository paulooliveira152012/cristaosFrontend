import React, { useState, useEffect } from "react";
import "../styles/header.css";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import SettingsIcon from "../assets/icons/settingIcon";
import SideMenu from "./SideMenu";
import BackArrow from "../assets/icons/Arrow_left";
import CloseIcon from "../assets/icons/closeIcon";
import PrivateMessageSettings from "./PrivateMessageSettings";
import { handleLogout, handleBack } from "./functions/headerFunctions";

const Header = ({
  showBackButton = false,
  showLoginButton = true,
  showLogoutButton = true,
  showWelcomeMessage = true,
  showLeavePrivateRoomButton = false,
  handleLeaveDirectMessagingChat,
  showProfileImage = true,
  showSettingsIcon = false,
  showBackArrow = true,
  showCloseIcon = false,
  openLiveSettings,
  roomId,
  roomTitle = "",
  onBack,
  showLeaveButton = false,
  handleLeaveRoom,
  socket,
  navigate,
}) => {
  const { currentUser, logout } = useUser();
  const [newRoomTitle, setNewRoomTitle] = useState(roomTitle);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showPrivateMessagingSettings, setShowPrivateMessagingSettings] = useState(false);

  useEffect(() => {
    setNewRoomTitle(roomTitle || "");
  }, [roomTitle]);

  const toggleSideMenu = () => {
    setShowSideMenu((prev) => !prev);
  };

  useEffect(() => {
    const scrollEl = document.getElementById("scrollableContainer");
    if (scrollEl) {
      if (showSideMenu) scrollEl.classList.add("no-scroll");
      else scrollEl.classList.remove("no-scroll");
    }
  }, [showSideMenu]);

  return (
    <div className="stickyHeader">
      <SideMenu isOpen={showSideMenu} closeMenu={toggleSideMenu} />
      <div className="header">
        <div className="left-section">
          {showBackButton && (
            <button
              onClick={() =>
                handleBack(onBack, navigate, socket, roomId, currentUser?._id)
              }
              className="back-button"
            >
              Voltar
            </button>
          )}
          {showBackArrow && (
            <BackArrow
              onClick={() => {
                if (onBack) onBack();
                else if (navigate) navigate(-1);
              }}
            />
          )}
          {showProfileImage && (
            <div
              className="headerProfileImage"
              onClick={toggleSideMenu}
              style={{
                backgroundImage: `url(${currentUser?.profileImage || imagePlaceholder})`,
              }}
            ></div>
          )}
        </div>

        <div className="right-section">
          {!currentUser && showLoginButton && (
            <Link to={"/login"} className="link">
              <button className="login-button">Login</button>
            </Link>
          )}

          {showLeaveButton && (
            <button onClick={handleLeaveRoom} className="leaveRoomButton">
              Sair
            </button>
          )}

          {showCloseIcon && (
            <CloseIcon
              onClick={handleLeaveRoom}
              style={{ alignSelf: "center", cursor: "pointer" }}
            />
          )}

          {showSettingsIcon && (
            <SettingsIcon className="settingsIcon" onClick={openLiveSettings} />
          )}

          {showLeavePrivateRoomButton && (
            <p onClick={() => setShowPrivateMessagingSettings(true)}>Menu</p>
          )}
          {showPrivateMessagingSettings && (
            <PrivateMessageSettings
              onClose={() => setShowPrivateMessagingSettings(false)}
              onLeave={() =>
                handleLeaveDirectMessagingChat({
                  conversationId: roomId,
                  userId: currentUser._id,
                  navigate,
                })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
