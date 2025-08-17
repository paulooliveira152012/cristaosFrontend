// src/pages/MainChat.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import ChatComponent from "../components/ChatComponent";
import { handleBack } from "../components/functions/headerFunctions";
import { useSocket } from "../context/SocketContext";
import { useUnread } from "../context/UnreadContext";
import {
  useReadOnOpenAndFocus,
  useMainNewMessageLog,
} from "./functions/chatUnifiedFunctions";

import "../styles/style.css";
import "../styles/liveRoom.css";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const MainChat = () => {
  const { socket } = useSocket(); // ✅ desestrutura
  const { currentUser } = useUser();
  const { reset, MAIN_ROOM_ID } = useUnread(); // ✅ usa só o da store
  const navigate = useNavigate();

  useReadOnOpenAndFocus({
    kind: "main",
    id: MAIN_ROOM_ID,
    baseURL,
    reset,
  });
  useMainNewMessageLog(socket, MAIN_ROOM_ID);

  // Marca o main chat como lido ao abrir (e ao voltar o foco)
  useEffect(() => {
    const mark = () =>
      fetch(`${baseURL}/api/users/markMainChatAsRead`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    mark();
    reset(MAIN_ROOM_ID);

    const onFocusOrVisible = () => {
      mark();
      reset(MAIN_ROOM_ID);
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [baseURL, reset, MAIN_ROOM_ID]);

  // (Opcional) log/efeitos quando chega msg do main (o ChatComponent renderiza em si)
  useEffect(() => {
    if (!socket) return;
    const onNew = (payload) => {
      if (payload?.roomId !== MAIN_ROOM_ID) return;
      // console.log("Nova mensagem no mainChat:", payload);
    };
    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket, MAIN_ROOM_ID]);

  if (!currentUser?._id) {
    return (
      <div className="screenWrapper">
        <div className="liveRoomContent">
          <Header
            showProfileImage={false}
            showLogoutButton={false}
            showBackArrow={true}
            onBack={() => handleBack(navigate)}
          />
          <div className="loadingContainer">
            <p>Faça login para acessar o Chat Principal.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screenWrapper">
      <div className="liveRoomContent">
        <Header
          showProfileImage={false}
          showLogoutButton={false}
          showBackArrow={true}
          onBack={() => handleBack(navigate)}
        />

        <p
          style={{ textAlign: "center", marginBottom: 10, fontStyle: "italic" }}
        >
          Bem-vindo ao Chat Principal
        </p>

        {/* O ChatComponent já faz join/leave via "joinRoomChat"/"leaveRoomChat" */}
        <ChatComponent roomId={MAIN_ROOM_ID} />
      </div>
    </div>
  );
};

export default MainChat;
