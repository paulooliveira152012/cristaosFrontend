import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "../context/UserContext";
import io from "socket.io-client";
import Header from '../components/Header.js';
import '../styles/style.css';

let socket; // Declare socket globally to manage connection across the component

const LiveRoom = () => {
  const { currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { sala } = location.state || {};
  const roomMembers = sala?.roomMembers || [];

//   useEffect(() => {
//     // Initialize Socket.IO client connection
//     socket = io("https://your-socket-server-url");

//     // When component mounts, join the room
//     socket.emit("joinRoom", {
//       roomId: sala._id,
//       user: {
//         id: currentUser._id,
//         name: currentUser.username,
//         profileImage: currentUser.profileImage,
//       },
//     });

//     // Listen for the updated list of users in the room
//     socket.on("roomData", ({ roomMembers }) => {
//       console.log("Updated room members:", roomMembers);
//     });

//     // Clean up when the component unmounts (leave the room)
//     return () => {
//       socket.emit("leaveRoom", {
//         roomId: sala._id,
//         userId: currentUser._id,
//       });
//       socket.disconnect();
//     };
//   }, [sala._id, currentUser]);

  return (
    <div>
      <Header showProfileImage={false} />
      <p>Bem-vindo à sala {sala?.roomTitle}</p>
      <div className="liveInRoomMembersContainer">
        {roomMembers.length > 0 ? (
          roomMembers.map((member, index) => (
            <div key={index} className="liveMemberContainer">
              <div className="liveMemberContent">
                <div 
                  className="liveMemberProfileImage" 
                  style={{
                    backgroundImage: `url(${member.image || ''})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#ddd",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%"
                  }}
                />
                <p>{member.name || 'Anonymous'}</p>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhum membro na sala.</p>
        )}
      </div>
    </div>
  );
};

export default LiveRoom;
