// src/pages/AllUsersPage.js
import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  getFriendIds,
  sendFriendRequest,
} from "../components/functions/liveUsersComponent";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useUsers } from "../context/UserContext";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";
import "../styles/style.css";
import "../styles/allUsers.css";
import placeholder from "../assets/images/profileplaceholder.png";

const AllUsersPage = () => {
  const { currentUser } = useUser();
  const { onlineUsers } = useUsers();

  const [allUsers, setAllUsers] = useState([]);
  const [friendIds, setFriendIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set()); // NEW: convites enviados/pendentes
  const [sending, setSending] = useState({});              // { [userId]: true } enquanto envia
  const navigate = useNavigate();

  // 1) Todos os usuários
  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  // 2) IDs dos amigos do usuário logado
  useEffect(() => {
    let cancel = false;
    (async () => {
      const userId = currentUser?._id;
      if (!userId) return;
      try {
        const idsSet = await getFriendIds(userId);
        if (!cancel) setFriendIds(idsSet);
      } catch {
        if (!cancel) setFriendIds(new Set());
      }
    })();
    return () => { cancel = true; };
  }, [currentUser?._id]);

  // 3) IDs pendentes (convites enviados por mim)
  useEffect(() => {
    // Se seu UserContext já traz sentFriendRequests, inicialize daqui
    const arr = currentUser?.sentFriendRequests || [];
    const init = new Set(arr.map((x) => String(x?._id ?? x)));
    setPendingIds(init);
  }, [currentUser?.sentFriendRequests]);

  // 4) Set online
  const onlineSet = useMemo(
    () =>
      new Set(
        (onlineUsers || []).map((u) => String(u?._id ?? u?.id ?? u?.userId))
      ),
    [onlineUsers]
  );

  // 5) Ordena: online primeiro; depois por username
  const sortedList = useMemo(() => {
    return [...(allUsers || [])].sort((a, b) => {
      const aOnline = onlineSet.has(String(a?._id));
      const bOnline = onlineSet.has(String(b?._id));
      if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline);
      return String(a?.username || "").localeCompare(String(b?.username || ""));
    });
  }, [allUsers, onlineSet]);

  // 6) Enviar pedido (marca como pendente, não como amigo)
  const handleAddFriend = async (targetId) => {
    try {
      setSending((s) => ({ ...s, [targetId]: true }));
      await sendFriendRequest(targetId);
      // Otimista: marca como PENDENTE para mostrar “…”
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(String(targetId));
        return next;
      });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível enviar o pedido de amizade.");
    } finally {
      setSending((s) => ({ ...s, [targetId]: false }));
    }
  };

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user?.username}`);
  };

  return (
    <div className="screenWrapper allUsersPage">
      <div className="scrollable">
        <Header showProfileImage={false} onBack={() => handleBack(navigate)} />

        {sortedList.length === 0 ? (
          <div className="allembersContainer" style={{ padding: 24, opacity: 0.7 }}>
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="allembersContainer">
            {sortedList.map((user) => {
              const id = String(user?._id ?? "");
              if (!id) return null;

              const isOnline = onlineSet.has(id);
              const isFriend = friendIds.has(id);
              const isMe = id === String(currentUser?._id || "");
              const isPending = pendingIds.has(id); // NEW

              return (
                <Link key={id} to={`/profile/${id}`} className="memberLink">
                  <div
                    className="landingOnlineUserContainer"
                    style={{ opacity: isOnline ? 1 : 0.5, position: "relative" }}
                    onClick={() => handleUserClick(user)}
                  >
                    <div
                      className="landingOnlineUserImage"
                      style={{ backgroundImage: `url(${user?.profileImage || placeholder})` }}
                    >
                      {isOnline && <span className="onlineStatus" />}
                    </div>

                    <p className="OnlineUserUsernameDisplay">{user?.username}</p>

                    {/* ✓ se já é amigo */}
                    {isFriend && (
                      <span className="friendBadge" title="Já é seu amigo">✓</span>
                    )}

                    {/* “…” se convite JÁ FOI ENVIADO e ainda não é amigo */}
                    {!isFriend && !isMe && isPending && (
                      <button
                        className="addFriendBtn"
                        title="Convite enviado"
                        disabled
                      >
                        …
                      </button>
                    )}

                    {/* “+” se ainda não enviou convite e não é amigo */}
                    {!isFriend && !isMe && !isPending && (
                      <button
                        className="addFriendBtn"
                        title="Adicionar amigo"
                        disabled={!!sending[id]}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddFriend(id);
                        }}
                      >
                        {sending[id] ? "…" : "+"}
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsersPage;
