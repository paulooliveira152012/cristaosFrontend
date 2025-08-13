// src/pages/MainChat.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import ChatComponent from "../components/ChatComponent";
import { handleBack } from "../components/functions/headerFunctions";
import socket from "../socket"; // ⬅️ ADICIONADO

import "../styles/style.css";
import "../styles/liveRoom.css";   // reaproveita .liveRoomContent / loading

const baseURL = process.env.REACT_APP_API_BASE_URL;
const MAIN_ROOM_ID = "mainChatRoom";

const MainChat = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  // Marca o chat principal como lido ao abrir
  useEffect(() => {
    fetch(`${baseURL}/api/users/markMainChatAsRead`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, []);

  // ⬇️ ENTRA/SAI da sala principal para receber eventos em tempo real
  useEffect(() => {
    if (!currentUser?._id) return;
    socket.emit("joinRoom", { roomId: MAIN_ROOM_ID, userId: currentUser._id });
    return () => {
      socket.emit("leaveRoom", { roomId: MAIN_ROOM_ID, userId: currentUser._id });
    };
  }, [currentUser?._id]);

  // ⬇️ ESCUTA novas mensagens (debug/side-effects aqui; o ChatComponent renderiza)
  useEffect(() => {
    const handleNewMessage = (payload) => {
      if (payload?.roomId !== MAIN_ROOM_ID) return;
      // aqui você pode fazer side-effects, logs, etc.
      // ex.: console.log("Nova mensagem no mainChat:", payload);
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, []);

  // (Opcional) se quiser bloquear quando não logado
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
          style={{
            textAlign: "center",
            marginBottom: "10px",
            fontStyle: "italic",
          }}
        >
          Bem-vindo ao Chat Principal
        </p>

        {/* Chat em si (mesmo componente usado no LiveRoom) */}
        <ChatComponent roomId={MAIN_ROOM_ID} />
        {/* Se o seu ChatComponent usa outra prop:
            <ChatComponent conversationId={MAIN_ROOM_ID} /> */}
      </div>
    </div>
  );
};

export default MainChat;
