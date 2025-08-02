import { useEffect, useState } from "react";
import { getAllUsers } from "../components/functions/liveUsersComponent";
import { Link } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";
import { useNavigate } from "react-router-dom";

const AllUsersPage = () => {
  const { onlineUsers } = useUsers();
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate()

  useEffect(() => {
    getAllUsers(setAllUsers);
  }, []);

  const handleUserClick = (user) => {
    console.log(`Ativando interação com ${user.username}`);
  };

  const offlineUsers = allUsers.filter(
    (user) => !onlineUsers.some((onlineUser) => onlineUser._id === user._id)
  );

  return (
    <div>
        <Header 
            showProfileImage={false}
            onBack={() => 
                handleBack(
                    navigate
                )
            }
        />
      <h2>all Users</h2>

      <div className="allembersContainer">
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
                <span className="onlineStatus"></span>{" "}
                {/* Add the green ball */}
              </div>
              <p className="OnlineUserUsernameDisplay">{user.username}</p>
            </div>
          </Link>
        ))}

        {offlineUsers.map((user) => (
          <Link key={user._id} to={`/profile/${user._id}`}>
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
              <p className="OnlineUserUsernameDisplay">{user.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AllUsersPage;
