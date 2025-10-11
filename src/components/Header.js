import React, { useState, useEffect } from "react";
// ⬇️ novo caminho (dentro de styles/components)
import "../styles/components/header.css";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import SettingsIcon from "../assets/icons/settingIcon";
import SideMenu from "./SideMenu";
import BackArrow from "../assets/icons/Arrow_left";
import CloseIcon from "../assets/icons/closeIcon";
import PrivateMessageSettings from "./PrivateMessageSettings";
import { handleLogout, handleBack } from "./functions/headerFunctions";
import { useRoom } from "../context/RoomContext";

import { startLiveCore } from "../context/functions.js/roomContextFunctions";

import { useAudio } from "../context/AudioContext";

import { RiVoiceAiLine } from "react-icons/ri";
import { IoIosSettings } from "react-icons/io";

import { useSocket } from "../context/SocketContext";

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
  navigate,
}) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const [newRoomTitle, setNewRoomTitle] = useState(roomTitle);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showPrivateMessagingSettings, setShowPrivateMessagingSettings] =
    useState(false);

  const { 
    room, 
    startLive,
    leaveRoom
  } = useRoom();
  const { joinChannel, setIsSpeaker, setIsLive } = useAudio();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

  useEffect(() => {
    setNewRoomTitle(roomTitle || "");
  }, [roomTitle]);

  const toggleSideMenu = () => setShowSideMenu((prev) => !prev);

  useEffect(() => {
    // mostra/esconde scroll do feed principal
    const scrollEl = document.querySelector(".scrollable");
    if (scrollEl) {
      scrollEl.classList.toggle("no-scroll", showSideMenu);
    }

    // sinal global pro app: menu aberto/fechado
    document.body.dataset.menuOpen = showSideMenu ? "1" : "";
  }, [showSideMenu]);

  // console.log("room no header:", room)
  // console.log(
  //   "baseUrl, currentUser, roomId, joinChannel:",
  //   baseUrl,
  //   currentUser,
  //   effectiveRoomId,
  //   typeof joinChannel
  // );

  return (
    <div className="stickyHeader">
      <SideMenu isOpen={showSideMenu} closeMenu={toggleSideMenu} />
      <div className="header">
        <div className="left-section">
          {showBackButton && (
            <button
              onClick={() => handleBack(navigate, socket, roomId)}
              className="back-button"
            >
              Voltar
            </button>
          )}

          {showBackArrow && (
            <BackArrow onClick={() => handleBack(navigate, socket, roomId)} />
          )}

          {showProfileImage && (
            <div
              className="headerProfileImage"
              onClick={toggleSideMenu}
              style={{
                backgroundImage: `url(${
                  currentUser?.profileImage || imagePlaceholder
                })`,
              }}
            />
          )}
        </div>

        <div className="right-section">
          {!currentUser && showLoginButton && (
            <Link to={"/login"} className="link">
              <button className="login-button">Login</button>
            </Link>
          )}

          {/* {showLeaveButton && (
            <button onClick={handleLeaveRoom} className="leaveRoomButton">
              Sair
            </button>
          )} */}

          {showLeaveButton && room?.isLive && (
            <button onClick={leaveRoom} className="leaveRoomButton">
              Sair
            </button>
          )}

          {showLeaveButton && !room?.isLive && (
            <RiVoiceAiLine
              onClick={async () => {
                const res = await startLive({
                  joinChannel,
                  setIsSpeaker,
                  setIsLive,
                });
                if (!res.ok) console.warn("Falha ao iniciar live:", res);
              }}
            />
          )}

          {showCloseIcon && (
            <CloseIcon
              onClick={handleLeaveRoom}
              style={{ alignSelf: "center", cursor: "pointer" }}
            />
          )}

          {showSettingsIcon && (
            <IoIosSettings
              className="settingsIcon"
              onClick={openLiveSettings}
            />
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
                  userId: currentUser?._id,
                  username: currentUser.username,
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
