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

  // ---- helpers para mensagens de sistema ----
  const SYSTEM_REGEX =
    /(saiu da conversa|saiu da sala|entrou na conversa|voltou para a conversa|voltou para a sala)/i;

  const isSystemMessage = (m) =>
    m?.type === "system" ||
    m?.isSystem === true ||
    ["join", "leave", "return", "reinvite"].includes(m?.eventType) ||
    SYSTEM_REGEX.test(m?.message ?? "");

  const getSystemVariant = (m) => {
    if (
      m?.eventType === "join" ||
      m?.eventType === "return" ||
      m?.eventType === "reinvite"
    )
      return "join";
    if (m?.eventType === "leave") return "leave";
    // fallback baseado no texto:
    if (/saiu/i.test(m?.message)) return "leave";
    if (/entrou|voltou/i.test(m?.message)) return "join";
    return "info";
  };

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

        <p
          style={{ textAlign: "center", marginBottom: 10, fontStyle: "italic" }}
        >
          Conversa privada
        </p>

        <div className="chatComponent">
          <div ref={messagesContainerRef} className="chatScroll">
            <div className="messages">
              {messages.map((msg, index) => {
  const when = msg.timestamp ? format(new Date(msg.timestamp), "dd-MM-yy h:mm a") : "";

  // ---- branch: mensagens de sistema ----
  if (isSystemMessage(msg)) {
    const variant = getSystemVariant(msg); // "join" | "leave" | "info"
    return (
      <div
        key={msg._id ?? `sys-${msg.timestamp ?? index}-${index}`}
        className={` systemMessageRow system-${variant}`}
      >
        <div className="systemMessageBubble">
          <span className="systemMessageText">{msg.message}</span>
          {when && <small className="systemMessageTime">{when}</small>}
        </div>
      </div>
    );
  }

  // ---- branch: mensagens normais (mantém seu código atual) ----
  const author =
    msg.senderUsername ||
    msg.username ||
    (msg.sender && String(msg.sender) === String(currentUser?._id) ? "Você" : "Usuário");

  if (!usernameColors.current[author]) {
    usernameColors.current[author] = getRandomDarkColor();
  }
  const isMine =
    (msg.userId && String(msg.userId) === String(currentUser?._id)) ||
    (msg.sender && String(msg.sender) === String(currentUser?._id));

  const authorId = msg.userId || msg.sender;
  const avatar = msg.profileImage || profilePlaceholder;

  return (
    <div
      key={msg._id ?? `${msg.sender ?? "unknown"}-${msg.timestamp ?? index}-${index}`}
      className={`messageRow ${isMine ? "mine" : "theirs"}`}
    >
      <Link to={`/profile/${authorId || ""}`} className="avatarLink">
        <div className="chatAvatar" style={{ backgroundImage: `url(${avatar})` }} title={author} />
      </Link>

      <div className="messageBubble">
        <div className="messageHeader">
          <strong className="author" style={{ color: usernameColors.current[author] }} title={author}>
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
