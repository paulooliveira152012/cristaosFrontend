import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  fetchNotifications,
  acceptFriendRequest,
  rejectFriendRequest,
  markNotificationAsRead,
  acceptDmRequest,
  rejectDmRequest,
} from "./functions/functions/notificationsFunctions.js";
import "../styles/notifications.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import {
  markAllNotificationsAsRead,
  checkForNewNotifications,
} from "../components/functions/footerFunctions.js";

export const Notifications = ({ setNotifications }) => {
  const { currentUser } = useUser();
  const [friendRequests, setFriendRequests] = useState([]);
  const [dmRequests, setDmRequests] = useState([]);
  const [otherNotifications, setOtherNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // para evitar cliques múltiplos
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        const allNotifs = await fetchNotifications();

        // Ordenar por data (mais recentes primeiro)
        const sorted = allNotifs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Separar pedidos de amizade das outras notificações
        const requests = sorted.filter(
          (n) => n.type === "friend_request" && n.fromUser !== null
        );

        const dm = sorted.filter(
          (n) => n.type === "chat_request" || n.type === "chat_reinvite" && n.fromUser !== null
        );

        const others = sorted.filter(
          (n) => n.type !== "friend_request" && n.type !== "chat_request"
        );

        setFriendRequests(requests);
        setDmRequests(dm);
        setOtherNotifications(others);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    // Assim que abrir a página, marcar todas como lidas
    markAllNotificationsAsRead().then(() => {
      // 2. Atualizar o Footer (só chamar check novamente)
      checkForNewNotifications(setNotifications);
    });
  }, []);

  const handleAccept = async (requesterId) => {
    setProcessingId(requesterId);
    await acceptFriendRequest(requesterId);

    setFriendRequests((prev) =>
      prev.filter((r) => r.fromUser._id !== requesterId)
    );
    setProcessingId(null);
  };

  const handleReject = async (requesterId) => {
    setProcessingId(requesterId);
    await rejectFriendRequest(requesterId);
    setFriendRequests((prev) =>
      prev.filter((r) => r.fromUser._id !== requesterId)
    );
    setProcessingId(null);
  };

  const handleAcceptDm = async (request) => {
    setProcessingId(request._id);
    await acceptDmRequest(request.fromUser._id, currentUser._id, request._id);

    setDmRequests((prev) => prev.filter((r) => r._id !== request._id));

    setProcessingId(null);
  };

  const handleRejectDm = async (request) => {
    setProcessingId(request._id);
    await rejectDmRequest(request.fromUser._id, currentUser._id, request._id);

    setDmRequests((prev) => prev.filter((r) => r._id !== request._id));

    setProcessingId(null);
  };

  const handleNotificationClick = async (notif) => {
    const token = localStorage.getItem("token");
    await markNotificationAsRead(notif._id, token);

    setOtherNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
    );

    if (notif.type === "comment" || notif.type === "reply") {
      if (notif.listingId && notif.commentId) {
        navigate(
          `/openListing/${notif.listingId}?commentId=${notif.commentId}`
        );
      } else if (notif.listingId) {
        navigate(`/openListing/${notif.listingId}`);
      }
    } else if (notif.type === "like") {
      if (notif.listingId) {
        navigate(`/openListing/${notif.listingId}`);
      }
    }
  };

  if (loading) return <p>Carregando notificações...</p>;

  console.log(otherNotifications);

  const generateNotificationLink = (notif) => {
    switch (notif.type) {
      case "like":
      case "comment":
        return `/openListing/${notif.listingId}`;
      case "reply":
        return `/openListing/${notif.listingId}?commentId=${notif.commentId}`;
      case "friend_request":
        return `/friends`;
      default:
        return "/";
    }
  };

  console.log("friendRequests", friendRequests);

  return (
    <div className="notificationsContainer">
      <h2>Notificações</h2>

      {friendRequests.length > 0 && (
        <div className="friendRequests">
          <h3>Pedidos de amizade</h3>
          <ul>
            {friendRequests.map((request) => (
              <li key={request._id}>
                <strong>
                  {request.fromUser?.username || "Usuário desconhecido"}{" "}
                </strong>{" "}
                quer ser seu amigo!
                <button
                  onClick={() => handleAccept(request.fromUser._id)}
                  disabled={processingId === request.fromUser._id}
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleReject(request.fromUser._id)}
                  disabled={processingId === request.fromUser._id}
                >
                  Rejeitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* chatRequests */}
      {dmRequests.length > 0 && (
        <div className="dmRequests">
          <h3>Solicitaçoes de conversa</h3>
          <ul>
            {dmRequests.map((request) => (
              <div className="chatRequestDecision">
                <li key={request._id}>
                  {request.content}
                  <button
                    onClick={() => handleAcceptDm(request)}
                    disabled={processingId === request._id}
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleRejectDm(request)}
                    disabled={processingId === request._id}
                  >
                    Rejeitar
                  </button>
                </li>
              </div>
            ))}
          </ul>
        </div>
      )}

      <div className="generalNotifications">
        <br></br>
        <h3>Outras notificações</h3>
        {otherNotifications.length > 0 ? (
          <ul>
            {otherNotifications.map((notif) => (
              <li key={notif._id} className={notif.isRead ? "read" : "unread"}>
                <div
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                >
                  {notif.content}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
};
