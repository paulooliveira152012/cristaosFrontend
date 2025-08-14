// src/pages/AllUsersPage.js
import { useEffect, useMemo, useState } from "react";
import { getAllUsers } from "../components/functions/liveUsersComponent";
import { Link, useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";
import "../styles/style.css";
import "../styles/allUsers.css";
import placeholder from "../assets/images/profileplaceholder.png";

const AllUsersPage = () => {
  const { onlineUsers } = useUsers();
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  // Set de IDs online para lookup O(1)
  const onlineSet = useMemo(
    () => new Set((onlineUsers || []).map((u) => String(u._id))),
    [onlineUsers]
  );

  // Ordena: online primeiro; depois por username
  const sortedList = useMemo(() => {
    return [...(allUsers || [])].sort((a, b) => {
      const aOnline = onlineSet.has(String(a._id));
      const bOnline = onlineSet.has(String(b._id));
      if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline);
      return String(a.username || "").localeCompare(String(b.username || ""));
    });
  }, [allUsers, onlineSet]);

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user.username}`);
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
              const id = String(user._id || "");
              const isOnline = onlineSet.has(id);

              const Item = (
                <div
                  className="landingOnlineUserContainer"
                  style={{ opacity: isOnline ? 1 : 0.5 }}
                  onClick={() => handleUserClick(user)}
                >
                  <div
                    className="landingOnlineUserImage"
                    style={{
                      backgroundImage: `url(${user.profileImage || placeholder})`,
                    }}
                  >
                    {isOnline && <span className="onlineStatus" />}
                  </div>
                  <p className="OnlineUserUsernameDisplay">{user.username}</p>
                </div>
              );

              return id ? (
                <Link key={id} to={`/profile/${id}`} className="memberLink">
                  {Item}
                </Link>
              ) : (
                <div key={`no-id-${user.username}`} className="memberLink">
                  {Item}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsersPage;
