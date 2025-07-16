import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import {
  fetchUserFriends,
  removeFriend,
} from "../functions/profilePageFunctions";

export const ProfileUserFriends = ({ user }) => {
  const { currentUser } = useUser();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null); // Para prevenir spam de clique

  useEffect(() => {
    if (user?._id) {
      const getFriends = async () => {
        try {
          const data = await fetchUserFriends(user._id);
          setFriends(data);
        } catch (error) {
          console.error("Erro ao buscar amigos:", error);
        } finally {
          setLoading(false);
        }
      };

      getFriends();
    }
  }, [user?._id]);

  const handleRemoveFriend = async (friendId) => {
    setRemovingId(friendId);
    const result = await removeFriend(friendId);
    if (result?.error) {
      alert(result.error);
    } else {
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    }
    setRemovingId(null);
  };

  if (loading) return <p>Carregando amigos...</p>;

  return (
    <div className="friends-section">
      <h3>Amigos de {user.username}</h3>
      {friends.length === 0 ? (
        <p>{user.username} ainda não tem amigos.</p>
      ) : (
        <ul className="friend-list">
          {friends.map((friend) => (
            <li key={friend._id} className="friend-card">
              <img
                src={friend.profileImage || "/default-profile.png"}
                className="friend-avatar"
              />
              <span>{friend.username}</span>

              {/* Mostra botão de remover se o perfil visualizado for o do próprio usuário */}
              {currentUser?._id === user._id && (
                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  disabled={removingId === friend._id}
                  style={{
                    marginLeft: "10px",
                    padding: "5px 10px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {removingId === friend._id ? "Removendo..." : "Remover"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
