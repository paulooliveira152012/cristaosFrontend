import React, { useState, useEffect } from "react";
import "../styles/components/header.css";
import { Link } from "react-router-dom";

import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext";
import { useAudio } from "../context/AudioContext";
import { useSocket } from "../context/SocketContext";

import imagePlaceholder from "../assets/images/profileplaceholder.png";
import SideMenu from "./SideMenu";
import BackArrow from "../assets/icons/Arrow_left";
import CloseIcon from "../assets/icons/closeIcon";
import PrivateMessageSettings from "./PrivateMessageSettings";
import { handleBack } from "./functions/headerFunctions";

import { RiVoiceAiLine } from "react-icons/ri";
import { IoIosSettings } from "react-icons/io";

const Header = ({
  showBackButton = false,
  showLoginButton = true,
  showLogoutButton = true, // (não usado aqui, mantido para compat)
  showWelcomeMessage = true, // (não usado aqui, mantido para compat)
  showLeavePrivateRoomButton = false,
  handleLeaveDirectMessagingChat,
  showProfileImage = true,
  showSettingsIcon = false,
  showBackArrow = true,
  showCloseIcon = false,
  openLiveSettings,
  roomId,
  roomTitle = "",
  onBack, // (não usado aqui, mantido para compat)
  showLeaveButton = false,
  handleLeaveRoom,
  navigate,
}) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "";
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const { room, leaveRoom, canStartRoom } = useRoom();
  const audio = useAudio();

  const [newRoomTitle, setNewRoomTitle] = useState(roomTitle);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showPrivateMessagingSettings, setShowPrivateMessagingSettings] =
    useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setNewRoomTitle(roomTitle || "");
  }, [roomTitle]);

  const toggleSideMenu = () => setShowSideMenu((prev) => !prev);

  useEffect(() => {
    const scrollEl = document.querySelector(".scrollable");
    if (scrollEl) scrollEl.classList.toggle("no-scroll", showSideMenu);
    document.body.dataset.menuOpen = showSideMenu ? "1" : "";
  }, [showSideMenu]);

  const userId = String(currentUser?._id || "");
  const canStart =
    !!userId &&
    Array.isArray(canStartRoom) &&
    canStartRoom.some((entry) => {
      const id =
        entry && typeof entry === "object" && "_id" in entry
          ? entry._id
          : entry;
      return String(id) === userId;
    });

  async function handleStartLiveClick() {
    if (starting) return;
    if (!roomId || !currentUser?._id) return;

    try {
      setStarting(true);

      // Inicia live no backend e já recebe { rtc: { channel, token, uid } }
      const resp = await fetch(`${baseUrl}/api/rooms/${roomId}/live/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await resp.json();

      if (!resp.ok || !data?.ok || !data?.rtc?.token || !data?.rtc?.channel) {
        console.warn("[Header] startLive backend falhou:", data);
        return;
      }

      const { rtc } = data;

      // 1) join com token de PUBLISHER
      const okJoin = await audio.ensureJoined(rtc.channel, rtc.uid, rtc.token);
      if (!okJoin) {
        console.warn("[Header] ensureJoined falhou");
        return;
      }

      // 2) publicar mic (host)
      await audio.startMic();
      // Obs.: o backend deve emitir broadcastLiveSnapshot; o RoomContext atualiza room.isLive/speakers.
    } catch (e) {
      console.error("[Header] erro ao iniciar live:", e);
    } finally {
      setStarting(false);
    }
  }

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
            <Link to="/login" className="link">
              <button className="login-button">Login</button>
            </Link>
          )}

          {showLeaveButton && room?.isLive && (
            <button onClick={leaveRoom} className="leaveRoomButton">
              Sair
            </button>
          )}

          {showLeaveButton && canStart && !room?.isLive && (
            <RiVoiceAiLine
              onClick={handleStartLiveClick}
              style={{
                cursor: starting ? "not-allowed" : "pointer",
                opacity: starting ? 0.6 : 1,
              }}
              title={starting ? "Iniciando..." : "Iniciar live"}
            />
          )}

          {showCloseIcon && (
            <CloseIcon
              onClick={handleLeaveRoom}
              style={{ alignSelf: "center", cursor: "pointer" }}
            />
          )}

          {showSettingsIcon && (
            <IoIosSettings className="settingsIcon" onClick={openLiveSettings} />
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
                  username: currentUser?.username,
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