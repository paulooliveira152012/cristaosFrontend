import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  getFriendIds,
  sendFriendRequest, // ⬅️ importar
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
  const [sending, setSending] = useState({}); // { [userId]: true } enquanto envia
  const navigate = useNavigate();

  // 1) Busca todos os usuários
  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  // 2) Busca IDs dos amigos do usuário logado
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

  // 3) Set de online
  const onlineSet = useMemo(
    () => new Set((onlineUsers || []).map((u) => String(u?._id ?? u?.id ?? u?.userId))),
    [onlineUsers]
  );

  // 4) Ordena: online primeiro; depois por username
  const sortedList = useMemo(() => {
    return [...(allUsers || [])].sort((a, b) => {
      const aOnline = onlineSet.has(String(a?._id));
      const bOnline = onlineSet.has(String(b?._id));
      if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline);
      return String(a?.username || "").localeCompare(String(b?.username || ""));
    });
  }, [allUsers, onlineSet]);

  const handleAddFriend = async (targetId) => {
    try {
      setSending((s) => ({ ...s, [targetId]: true }));
      await sendFriendRequest(targetId);
      // otimista: já considera “amigo/pendente” e some o botão
      setFriendIds((prev) => {
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

                    {/* “+” se NÂO é amigo e NÂO sou eu */}
                    {!isFriend && !isMe && (
                      <button
                        className="addFriendBtn"
                        title="Adicionar amigo"
                        disabled={!!sending[id]}
                        onClick={(e) => {
                          e.preventDefault(); // não navegar
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
