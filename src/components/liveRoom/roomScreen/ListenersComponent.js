// src/components/liveRoom/ListenersComponent.js
import React from "react";
import { useRoom } from "../../../context/RoomContext";
import { Link } from "react-router-dom";

const FALLBACK_AVATAR = "/images/avatar-placeholder.png";

const Listeners = React.memo(function Listeners() {
  const { room, loadingRoom } = useRoom();
  // console.log("room no ListenersComponent:", room)

  const listeners = room?.currentUsersInRoom || [];
  // console.log("listeners:", listeners)

  if (loadingRoom) {
    return (
      <div className="inRoomUsers">
        <p>Carregando ouvintes…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="inRoomUsers">
        <p>Nenhuma sala carregada.</p>
      </div>
    );
  }

  if (!listeners.length) {
    return (
      <div className="inRoomUsers">
        <p>Nenhum ouvinte no momento.</p>
      </div>
    );
  }

  

  return (
    <div className="inRoomUsers">
      {listeners.map((m, idx) => {
        const id = m?._id;
        const key = id || `idx-${idx}`;
        const profileImg = m?.profileImage || FALLBACK_AVATAR;
        const username = m?.username || "Usuário";

        const avatar = (
          <div
            className="liveMemberProfileImage"
            style={{
              backgroundImage: `url(${profileImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#ddd",
              borderRadius: "50%",
              cursor: id ? "pointer" : "default",
            }}
            aria-label={`Perfil de ${username}`}
            title={username}
          />
        );

        return (
          <div key={key} className="inRoomMembersParentContainer">
            <div className="inRoomLiveMemberContainer">
              <div className="liveMemberContent">
                {id ? <Link to={`/profile/${id}`}>{avatar}</Link> : avatar}
                {/* <p className="liveRoomUsername">{username}</p> */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default Listeners;
