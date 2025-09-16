import { useMemo } from "react";
import { useRoom } from "../../../context/RoomContext";
import { Link } from "react-router-dom";

const Speakers = () => {
  const { currentUsersSpeaking, currentUsers } = useRoom();

  console.log("speakers component")
  console.log("currentUsersSpeaking:", currentUsersSpeaking)

  // Mapa por id para resolver objetos parciais / ids
  const speakersResolved = useMemo(() => {
    const byId = new Map(
      (currentUsers || [])
        .filter(u => u && u._id)
        .map(u => [String(u._id), u])
    );

    const pickId = (s) => {
      if (!s) return null;
      if (typeof s === "string") return s;
      if (s._id) return s._id;
      if (s.user && typeof s.user === "object") return s.user._id ?? s.user;
      if (s.user) return s.user;
      return null;
    };

    const list = (currentUsersSpeaking || []).map((entry) => {
      // se já for user completo, retorna
      if (entry && entry._id && entry.username) return entry;
      // senão resolve via id
      const id = pickId(entry);
      return id ? byId.get(String(id)) || null : null;
    }).filter(Boolean);

    // dedup por _id
    const seen = new Set();
    return list.filter(u => {
      const k = String(u._id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [currentUsersSpeaking, currentUsers]);

  if (!speakersResolved?.length) {
    return <div className="liveInRoomMembersContainer"><p>Nenhum membro no palco.</p></div>;
  }

  return (
    <div className="liveInRoomMembersContainer">
      {speakersResolved.map((member) => {
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
