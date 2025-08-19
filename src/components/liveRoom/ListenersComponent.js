// src/components/liveRoom/ListenersComponent.js
import React, { useMemo } from "react";
import { useRoom } from "../../context/RoomContext";
import { Link } from "react-router-dom";

const FALLBACK_AVATAR = "/images/avatar-placeholder.png";

const Listeners = React.memo(function Listeners() {
  const { currentUsers = [], currentUsersSpeaking = [], roomReady } = useRoom();

  // ouvintes = todos os currentUsers que NÃO estão em currentUsersSpeaking
  const listeners = useMemo(() => {
    const speakingIds = new Set(
      (currentUsersSpeaking || []).map((u) => String(u._id))
    );
    return (currentUsers || [])
      .filter((u) => !speakingIds.has(String(u._id)))
      .sort((a, b) =>
        (a.username || "").localeCompare(b.username || "", undefined, {
          sensitivity: "base",
        })
      );
  }, [currentUsers, currentUsersSpeaking]);

  if (!roomReady) {
    return (
      <div className="inRoomUsers">
        <p>Carregando ouvintes…</p>
      </div>
    );
  }

  if (listeners.length === 0) {
    return (
      <div className="inRoomUsers">
        <p>Nenhum ouvinte no momento.</p>
      </div>
    );
  }

  return (
    <div className="inRoomUsers">
      {listeners.map((member) => (
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
                    backgroundImage: `url(${member.profileImage || FALLBACK_AVATAR})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#ddd",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  aria-label={`Perfil de ${member.username || "usuário"}`}
                />
              </Link>
              <p className="liveRoomUsername">{member.username || "Anonymous"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default Listeners;
