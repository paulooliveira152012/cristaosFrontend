// src/components/liveRoom/ListenersComponent.js
import React, { useMemo, useEffect } from "react";
import { useRoom } from "../../../context/RoomContext";
import { Link } from "react-router-dom";

const FALLBACK_AVATAR = "/images/avatar-placeholder.png";

const Listeners = React.memo(function Listeners() {
  const { 
    currentUsers,
    roomReady
  } = useRoom();

  if (!roomReady) {
    return (
      <div className="inRoomUsers">
        <p>Carregando ouvintes…</p>
      </div>
    );
  }

  if (currentUsers.length === 0) {
    return (
      <div className="inRoomUsers">
        <p>Nenhum ouvinte no momento.</p>
      </div>
    );
  }

  return (
    <div className="inRoomUsers">
      {currentUsers.map((member) => (
        <div key={member._id} className="inRoomMembersParentContainer">
          <div className="inRoomLiveMemberContainer">
            <div className="liveMemberContent">
              <Link
                to={`/profile/${member._id}`}
                title={member.username || "Usuário"}
              >
                <div
                  className="liveMemberProfileImage"
                  style={{
                    backgroundImage: `url(${
                      member.profileImage || FALLBACK_AVATAR
                    })`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#ddd",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  aria-label={`Perfil de ${member.username || "usuário"}`}
                />
              </Link>
              {/* <p className="liveRoomUsername">
                {member.username || "Anonymous"}
              </p> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default Listeners;