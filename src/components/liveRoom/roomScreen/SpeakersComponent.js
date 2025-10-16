import { useEffect, useMemo } from "react";
import { useRoom } from "../../../context/RoomContext";
import { Link } from "react-router-dom";

const Speakers = ( setDisplaySpeakers ) => {
  const { 
    room, 
    currentUsersSpeaking, 
    currentUsers 
  } = useRoom();

  // Mapa por id para resolver objetos parciais / ids
  const speakers = room?.speakers

  console.log("✅ room no SpeakersCOmponent:", room)
  console.log("✅ currentUsersSpeaking:", currentUsersSpeaking)


  console.log("speakers no SpeakersCOmponent:", speakers)

  if (!speakers?.length) {
    return <div className="liveInRoomMembersContainer"><p>Nenhum membro no palco.</p></div>;
  }

  return (
    <div className="liveInRoomMembersContainer">
      {speakers.map((member) => {
        const id = member._id;
        const username = member.username || "Anonymous";
        const profileImage = member.profileImage || "";
        const micOpen = typeof member.micOpen === "boolean" ? member.micOpen : false;

        return (
          <div key={id} className="liveMemberParentContainer">
            <div className="liveMemberContainer">
              <div className="liveMemberContent">
                <Link to={id ? `/profile/${id}` : "#"}>
                  <div
                    className="liveMemberProfileImage"
                    style={{
                      backgroundImage: `url(${profileImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: "#ddd",
                      borderRadius: "40%",
                      cursor: "pointer",
                    }}
                    aria-label={`Abrir perfil de ${username}`}
                    title={username}
                  />
                </Link>
                <p className="liveRoomUsername">{username}</p>
              </div>
            </div>
            {micOpen ? <span role="img" aria-label="microfone aberto">🎤</span>
                     : <span role="img" aria-label="microfone mutado">🔇</span>}
          </div>
        );
      })}
    </div>
  );
};

export default Speakers;
