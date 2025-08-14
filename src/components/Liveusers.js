import { useEffect, useMemo, useState } from "react";
import { useUsers } from "../context/UserContext";
import "../styles/style.css";
import { Link, useNavigate } from "react-router-dom";
import { getAllUsers } from "./functions/liveUsersComponent";

const FALLBACK_AVATAR = "/images/avatar-placeholder.png";

const LiveUsers = () => {
  const { onlineUsers } = useUsers();
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  useEffect(() => {
    // console.log("allUsers in Component:", allUsers);
  }, [allUsers]);

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user.username}`);
  };

  const offlineUsers = useMemo(() => {
    return allUsers.filter(
      (user) => !onlineUsers.some((u) => u._id === user._id)
    );
  }, [allUsers, onlineUsers]);

  return (
    <div className="landingOnlineMembersContainer">
      <div className="landingOnlineMembersList">
        {onlineUsers.map((user) => (
          <Link key={user._id} to={`/profile/${user._id}`}>
            <div className="landingOnlineUserContainer" title={user.username}>
              <div
                className="landingOnlineUserImage"
                onClick={() => handleUserClick(user)}
                style={{
                  backgroundImage: `url(${user.profileImage || FALLBACK_AVATAR})`,
                }}
              >
                <span className="onlineStatus" />
              </div>
            </div>
          </Link>
        ))}

        {offlineUsers.map((user) => (
          <Link key={user._id} to={`/profile/${user._id}`}>
            <div
              className="landingOnlineUserContainer"
              style={{ opacity: 0.5 }}
              title={user.username}
            >
              <div
                className="landingOnlineUserImage"
                onClick={() => handleUserClick(user)}
                style={{
                  backgroundImage: `url(${user.profileImage || FALLBACK_AVATAR})`,
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      <button
        className="verTodosBtn"
        onClick={() => navigate("/allUsers")}
        aria-label="Ver todos os usuários"
      >
        ver todos
      </button>
    </div>
  );
};

export default LiveUsers;
