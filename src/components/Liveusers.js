import { useEffect, useState } from "react";
import { useUsers } from "../context/UserContext"; // Access the context for online users
import "../styles/style.css";
import { Link } from "react-router-dom";
import { getAllUsers } from "./functions/liveUsersComponent";

const LiveUsers = () => {
  const { onlineUsers } = useUsers(); // Get the online users from context
  const [allUsers, setAllUsers] = useState([]);

  // buscar imediatamente os usuarios
  useEffect(() => {
    getAllUsers(setAllUsers);

    console.log("allUsers in Component:", allUsers);
  }, []);

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user.username}`);
  };

  console.log("Usuarios online no componente Liveusers: ", onlineUsers);

  const offlineUsers = allUsers.filter(
    (user) => !onlineUsers.some((onlineUser) => onlineUser._id === user._id)
  );

  return (
    <div className="landingOnlineMembersContainer">
      {/* <p>Usuarios online:</p> */}
      {/* Dynamically create divs for users who are online at the moment */}
      {onlineUsers.map((user) => (
        <Link key={user._id} to={`/profile/${user._id}`}>
          <div className="landingOnlineUserContainer">
            <div
              className="landingOnlineUserImage"
              onClick={() => handleUserClick(user)}
              style={{
                backgroundImage: `url(${user.profileImage})`,
              }}
            >
              <span className="onlineStatus"></span> {/* Add the green ball */}
            </div>
            {/* <p className="OnlineUserUsernameDisplay">{user.username}</p> */}
          </div>
        </Link>
      ))}

      {offlineUsers.map((user) => (
        <Link key={user._id} to={`/profile/${user._id}`} >
          <div
            className="landingOnlineUserContainer"
            style={{ opacity: "0.5" }}
          >
            <div
              className="landingOnlineUserImage"
              onClick={() => handleUserClick(user)}
              style={{
                backgroundImage: `url(${user.profileImage})`,
              }}
            ></div>
            {/* <p className="OnlineUserUsernameDisplay">{user.username}</p> */}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LiveUsers;
