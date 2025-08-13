import { useEffect, useMemo, useState } from "react";
import { getAllUsers } from "../components/functions/liveUsersComponent";
import { Link, useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";
import "../styles/style.css";
import "../styles/allUsers.css"
import placeholder from "../assets/images/profileplaceholder.png";

const AllUsersPage = () => {
  const { onlineUsers } = useUsers();
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  // 60 mocks se não vier nada do backend
  const mocks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        _id: `mock-${i + 1}`,
        profileImage: placeholder,
        username: `user${i + 1}`,
      })),
    []
  );

  const list = allUsers.length ? allUsers : mocks;

  // Set de IDs online para lookup O(1)
  const onlineSet = useMemo(() => new Set(onlineUsers.map(u => u._id)), [onlineUsers]);

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user.username}`);
  };

  // antes do return:
const sortedList = useMemo(() => {
  const onlineSet = new Set(onlineUsers.map(u => u._id));

  return [...list].sort((a, b) => {
    const aOnline = onlineSet.has(a._id);
    const bOnline = onlineSet.has(b._id);

    // online primeiro
    if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline);

    // tie-break estável (opcional): por username
    return String(a.username || "").localeCompare(String(b.username || ""));
  });
}, [list, onlineUsers]);


  return (
    <div className="screenWrapper allUsersPage">
      <div className="scrollable">
        <Header
          showProfileImage={false}
          onBack={() => handleBack(navigate)}
        />

        <div className="allembersContainer">
          {sortedList.map((user) => {
            const isOnline = onlineSet.has(user._id);
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

            // Só linka se tiver _id real; mocks continuam clicáveis mas sem rota
            return user._id && !String(user._id).startsWith("mock-") ? (
              <Link key={user._id} to={`/profile/${user._id}`} className="memberLink">
                {Item}
              </Link>
            ) : (
              <div key={user._id} className="memberLink">
                {Item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllUsersPage;
