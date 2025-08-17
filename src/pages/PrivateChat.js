// src/pages/PrivateChat.js
import React, { useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import { useUnread } from "../context/UnreadContext";

import "../styles/components/chat.css"; // mesmíssima folha do ChatComponent
import Header from "../components/Header";
import {
  handleLeaveDirectMessagingChat,
  handleInviteBackToChat,
} from "../components/functions/headerFunctions";

import {
  usePrivateChatController,
  useReadOnOpenAndFocus,
  useAutoScrollToBottom,
  getRandomDarkColor,
} from "./functions/chatUnifiedFunctions";

import { format } from "date-fns";
import profilePlaceholder from "../assets/images/profileplaceholder.png";

const PrivateChat = () => {
  const { socket } = useSocket();
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const { reset } = useUnread();
  const navigate = useNavigate();
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const {
    messages,
    message,
    setMessage,
    sendMessage,
    isOtherParticipant,
    pendingForMe,
    waitingOther,
    // isOtherPresent, // se quiser exibir status online
    acceptConversation,
    rejectConversation,
    reinviteConversation,
    canSend,
  } = usePrivateChatController({
    socket,
    conversationId,
    currentUser,
    baseURL,
    reset,
    inviteBackHandler: handleInviteBackToChat,
    onAccepted: () => reset(conversationId),
  });

  useReadOnOpenAndFocus({
    kind: "dm",
    id: conversationId,
    baseURL,
    reset,
    socket,
    userId: currentUser?._id,
  });

  // ===== UI =====
  const messagesContainerRef = useRef(null);
  useAutoScrollToBottom(messagesContainerRef, [messages]);
  const usernameColors = useRef({});

  return (
    <div className="screenWrapper">
      <div className="liveRoomContent">
        <Header
          showProfileImage={false}
          showLogoutButton={false}
          showBackArrow={true}
          showLeavePrivateRoomButton={true}
          handleLeaveDirectMessagingChat={() =>
            handleLeaveDirectMessagingChat({
              socket,
              conversationId,
              userId: currentUser?._id,
              username: currentUser?.username,
              navigate,
            })
          }
          roomId={conversationId}
          onBack={() => navigate(-1)}
        />

        <p style={{ textAlign: "center", marginBottom: 10, fontStyle: "italic" }}>
          Conversa privada
        </p>

        <div className="chatComponent">
          <div ref={messagesContainerRef} className="chatScroll">
            <div className="messages">
              {messages.map((msg, index) => {
                // Preferências de campos para DM
                const author =
                  msg.senderUsername ||
                  msg.username ||
                  (msg.sender && String(msg.sender) === String(currentUser?._id)
                    ? "Você"
                    : "Usuário");

                if (!usernameColors.current[author]) {
                  usernameColors.current[author] = getRandomDarkColor();
                }

                const isMine =
                  (msg.userId && String(msg.userId) === String(currentUser?._id)) ||
                  (msg.sender && String(msg.sender) === String(currentUser?._id));

                const when = msg.timestamp
                  ? format(new Date(msg.timestamp), "dd-MM-yy h:mm a")
                  : "";

                const authorId = msg.userId || msg.sender; // DM costuma enviar "sender"
                const avatar = msg.profileImage || profilePlaceholder;

                return (
                  <div
                    key={msg._id ?? `${msg.sender ?? "unknown"}-${msg.timestamp ?? index}-${index}`}
                    className={`messageRow ${isMine ? "mine" : "theirs"}`}
                  >
                    <Link to={`/profile/${authorId || ""}`} className="avatarLink">
                      <div
                        className="chatAvatar"
                        style={{ backgroundImage: `url(${avatar})` }}
                        title={author}
                      />
                    </Link>

                    <div className="messageBubble">
                      <div className="messageHeader">
                        <strong
                          className="author"
                          style={{ color: usernameColors.current[author] }}
                          title={author}
                        >
                          {author}
                        </strong>
                        <small className="time">{when}</small>
                      </div>
                      <div className="messageText">{msg.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Composer com os MESMOS estilos do ChatComponent */}
          <div className="composer">
            {canSend ? (
              <>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="composerInput"
                />
                <button className="sendBtn" onClick={sendMessage}>
                  Enviar
                </button>
              </>
            ) : pendingForMe ? (
              <>
                <button className="sendBtn" onClick={acceptConversation}>
                  Aceitar conversa
                </button>
                <button
                  className="inviteBackBtn"
                  onClick={async () => {
                    await rejectConversation();
                    navigate("/chat");
                  }}
                >
                  Rejeitar
                </button>
              </>
            ) : waitingOther ? (
              <button className="inviteBackBtn" disabled>
                Aguardando usuário aceitar a conversa…
              </button>
            ) : (
              <button className="inviteBackBtn" onClick={reinviteConversation}>
                Convidar usuário de volta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;
