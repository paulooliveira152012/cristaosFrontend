import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext.js";
import {
  markAllNotificationsAsRead,
  checkForNewNotifications,
} from "../components/functions/footerFunctions.js";

// Avatar com fallback (inicial)
const Avatar = ({ src, alt, size = 40 }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        className="ntf-avatar fallback"
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {alt?.[0]?.toUpperCase() || "?"}
      </div>
    );
  }
  return (
    <img
      className="ntf-avatar"
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setError(true)}
      style={{ width: size, height: size }}
    />
  );
};

const EmptyState = ({ title, caption }) => (
  <div className="ntf-emptystate" role="status" aria-live="polite">
    <div className="art" />
    <h4>{title}</h4>
    <p>{caption}</p>
  </div>
);

const Loader = () => (
  <div className="ntf-loader" aria-busy>
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </div>
);

export const Notifications = () => {
  const { currentUser } = useUser();
  const { setNotifications } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  // carregar
  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      try {
        const allNotifs = await fetchNotifications();
        const sorted = allNotifs
          .filter(Boolean)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItems(sorted);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  // marcar como lidas no mount
  useEffect(() => {
    if (!currentUser) return;
    markAllNotificationsAsRead().then(() => {
      checkForNewNotifications(setNotifications);
    });
  }, [currentUser, setNotifications]);

  // buckets
  const { friendRequests, dmRequests, otherNotifications } = useMemo(() => {
    const friendRequests = items.filter(
      (n) => n.type === "friend_request" && n.fromUser !== null
    );
    const dmRequests = items.filter(
      (n) =>
        (n.type === "chat_request" || n.type === "chat_reinvite") &&
        n.fromUser !== null
    );
    const otherNotifications = items.filter(
      (n) =>
        n.type !== "friend_request" &&
        n.type !== "chat_request" &&
        n.type !== "chat_reinvite"
    );
    return { friendRequests, dmRequests, otherNotifications };
  }, [items]);

  // ações amizade
  const handleAcceptFriend = async (requesterId) => {
    setProcessingId(requesterId);
    try {
      await acceptFriendRequest(requesterId);
      setItems((prev) => prev.filter((r) => r.fromUser?._id !== requesterId));
    } finally {
      setProcessingId(null);
    }
  };
  const handleRejectFriend = async (requesterId) => {
    setProcessingId(requesterId);
    try {
      await rejectFriendRequest(requesterId);
      setItems((prev) => prev.filter((r) => r.fromUser?._id !== requesterId));
    } finally {
      setProcessingId(null);
    }
  };

  // ações DM
  const handleAcceptDm = async (request) => {
    setProcessingId(request._id);
    try {
      await acceptDmRequest(request.fromUser._id, currentUser._id, request._id);
      setItems((prev) => prev.filter((r) => r._id !== request._id));
    } finally {
      setProcessingId(null);
    }
  };
  const handleRejectDm = async (request) => {
    setProcessingId(request._id);
    try {
      await rejectDmRequest(request.fromUser._id, currentUser._id, request._id);
      setItems((prev) => prev.filter((r) => r._id !== request._id));
    } finally {
      setProcessingId(null);
    }
  };

  // click em outras notificações
  const handleNotificationClick = async (notif) => {
    const token = localStorage.getItem("token");
    try {
      await markNotificationAsRead(notif._id, token);
      setItems((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    } catch {}
    if (notif.type === "comment" || notif.type === "reply") {
      if (notif.listingId && notif.commentId) {
        navigate(
          `/openListing/${notif.listingId}?commentId=${notif.commentId}`
        );
      } else if (notif.listingId) {
        navigate(`/openListing/${notif.listingId}`);
      }
    } else if (notif.type === "like") {
      if (notif.listingId) navigate(`/openListing/${notif.listingId}`);
    }
  };

  if (loading) {
    return (
      <div className="ntf-screen">
        <div className="ntf-header"><h2>Notificações</h2></div>
        <div className="ntf-card"><Loader /></div>
      </div>
    );
  }

  return (
    <div className="ntf-screen">
      <div className="ntf-header">
        <h2>Notificações</h2>
        <div className="ntf-header-actions">
          <span className="ntf-badge" title={`${items.length} no total`}>
            {items.length}
          </span>
        </div>
      </div>

      {/* Amizade */}
      {friendRequests.length > 0 && (
        <section className="ntf-section">
          <div className="ntf-section-head">
            <h3>Pedidos de amizade</h3>
            <span className="ntf-pill">{friendRequests.length}</span>
          </div>
          <div className="ntf-list">
            {friendRequests.map((request) => (
              <article className="ntf-item" key={request._id}>
                <Avatar
                  src={request.fromUser?.profileImage}
                  alt={request.fromUser?.username || "Usuário"}
                />
                <div className="ntf-item-body">
                  <div className="ntf-item-title">
                    <strong>{request.fromUser?.username || "Usuário"}</strong>
                    <span className="ntf-dot" />
                    <span className="ntf-time">
                      {new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="ntf-item-text">quer ser seu amigo(a).</p>

                  <div className="ntf-side">
                    <div className="ntf-decide-label">Deseja aceitar?</div>
                    <div className="ntf-actions">
                      <button
                        className="icon-btn reject"
                        onClick={() => handleRejectFriend(request.fromUser._id)}
                        disabled={processingId === request.fromUser._id}
                        aria-label="Rejeitar"
                        title="Rejeitar"
                      >
                        <svg
                          className="ntf-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn accept"
                        onClick={() => handleAcceptFriend(request.fromUser._id)}
                        disabled={processingId === request.fromUser._id}
                        aria-label="Aceitar"
                        title="Aceitar"
                      >
                        <svg
                          className="ntf-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* DMs */}
      {dmRequests.length > 0 && (
        <section className="ntf-section">
          <div className="ntf-section-head">
            <h3>Solicitações de conversa</h3>
            <span className="ntf-pill">{dmRequests.length}</span>
          </div>
          <div className="ntf-list">
            {dmRequests.map((request) => (
              <article className="ntf-item" key={request._id}>
                <Avatar
                  src={request.fromUser?.profileImage}
                  alt={request.fromUser?.username || "Usuário"}
                />
                <div className="ntf-item-body">
                  <div className="ntf-item-title">
                    <strong>{request.fromUser?.username || "Usuário"}</strong>
                    <span className="ntf-dot" />
                    <span className="ntf-time">
                      {new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="ntf-item-text">{request.content}</p>

                  <div className="ntf-side">
                    <div className="ntf-decide-label">Deseja aceitar?</div>
                    <div className="ntf-actions">
                      <button
                        className="icon-btn reject"
                        onClick={() => handleRejectDm(request)}
                        disabled={processingId === request._id}
                        aria-label="Rejeitar"
                        title="Rejeitar"
                      >
                        <svg
                          className="ntf-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn accept"
                        onClick={() => handleAcceptDm(request)}
                        disabled={processingId === request._id}
                        aria-label="Aceitar"
                        title="Aceitar"
                      >
                        <svg
                          className="ntf-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Outras */}
      <section className="ntf-section">
        <div className="ntf-section-head">
          <h3>Outras notificações</h3>
          <span className="ntf-pill">{otherNotifications.length}</span>
        </div>
        {otherNotifications.length > 0 ? (
          <div className="ntf-list">
            {otherNotifications.map((notif) => (
              <article
                key={notif._id}
                className={`ntf-item clickable ${notif.isRead ? "read" : "unread"}`}
                onClick={() => handleNotificationClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" ? handleNotificationClick(notif) : null)}
              >
                <Avatar
                  src={notif.fromUser?.profileImage}
                  alt={notif.fromUser?.username || "Usuário"}
                />
                <div className="ntf-item-body">
                  <div className="ntf-item-title">
                    <strong>{notif.title || notif.fromUser?.username || "Notificação"}</strong>
                    <span className="ntf-dot" />
                    <span className="ntf-time">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="ntf-item-text">{notif.content}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="ntf-card">
            <EmptyState
              title="Sem novidades por aqui"
              caption="Quando alguém curtir, comentar ou te mencionar, aparece aqui."
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications;
