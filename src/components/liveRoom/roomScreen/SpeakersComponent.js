import { useRoom } from "../../../context/RoomContext";
import { Link } from "react-router-dom";

const Speakers = () => {
  const { currentUsersSpeaking } = useRoom();

  return (
    <div className="liveInRoomMembersContainer">
      {currentUsersSpeaking.length > 0 ? (
        currentUsersSpeaking.map((member, index) => (
          <div key={index} className="liveMemberParentContainer">
            <div className="liveMemberContainer">
              <div className="liveMemberContent">
                <Link to={`/profile/${member._id}`}>
                  <div
                    className="liveMemberProfileImage"
                    style={{
                      backgroundImage: `url(${member.profileImage || ""})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: "#ddd",
                      borderRadius: "40%",
                      cursor: "pointer",
                    }}
                  />
                </Link>
                <p className="liveRoomUsername">
                  {member.username || "Anonymous"}
                </p>
              </div>
            </div>
            {member.micOpen ? (
              <span role="img">🎤</span>
            ) : (
              <span role="img">🔇</span>
            )}
          </div>
        ))
      ) : (
        <p>Nenhum membro no palco.</p>
      )}
    </div>
  );
};

export default Speakers;
