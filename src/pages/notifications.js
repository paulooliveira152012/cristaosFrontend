import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  fetchNotifications,
  acceptFriendRequest,
  rejectFriendRequest,
  markNotificationAsRead,
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
        const requests = sorted.filter((n) => n.type === "friend_request");
        const others = sorted.filter((n) => n.type !== "friend_request");

        setFriendRequests(requests);
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

  return (
    <div className="notificationsContainer">
      <h2>Notificações</h2>

      {friendRequests.length > 0 && (
        <div className="friendRequests">
          <h3>Pedidos de amizade</h3>
          <ul>
            {friendRequests.map((request) => (
              <li key={request._id}>
                <strong>{request.fromUser.username}</strong> quer ser seu amigo!
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

      <div className="generalNotifications">
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
          <p>Você não tem novas notificações.</p>
        )}
      </div>
    </div>
  );
};
