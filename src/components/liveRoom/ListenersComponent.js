import { useRoom } from "../../context/RoomContext";
import { Link } from "react-router-dom";

const Listeners = () => {
  const { currentUsers, currentUsersSpeaking } = useRoom();

  return (
    <div className="inRoomUsers">
      {currentUsers && currentUsers.length > 0 ? (
        currentUsers
          .filter(
            (listener) =>
              !currentUsersSpeaking.some(
                (speaker) => speaker._id === listener._id
              )
          )
          .map((member, index) => (
            <div key={member._id} className="inRoomMembersParentContainer">
              <div className="inRoomLiveMemberContainer">
                <div className="liveMemberContent">
                  <Link to={`/profile/${member._id}`}>
                    <div
                      className="liveMemberProfileImage"
                      style={{
                        backgroundImage: `url(${member.profileImage || ""})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#ddd",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }}
                    />
                  </Link>
                  <p className="liveRoomUsername">
                    {member.username || "Anonymous"}
                  </p>
                </div>
              </div>
            </div>
          ))
      ) : (
        <p>Nenhum membro na sala.</p>
      )}
    </div>
  );
};

export default Listeners;
