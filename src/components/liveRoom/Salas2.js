import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "../../styles/rooms.css";
// functions
import { fetchRooms, openLive } from "../../pages/functions/liveRoomFunctions2";
// components
// import { NewRoomComponent } from "./NewRoomComponent";
import { NewRoomComponent } from "./newRoom/NewRoomComponent";

const Salas2 = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  // USEEFFECT 1 => busque as salas
  useEffect(() => {
    const loadRooms = async () => {
      const data = await fetchRooms();
      setRooms(data);
    };
    loadRooms();
    // console.log("✅ rooms:", rooms);
  }, []); // dependencia vazia para garantir que rode apensa uma vez quando montar

  return (
    <div className="landingLivesContainer">
      {/* Mapping through fetched rooms (following the openLiveRooms pattern) */}
      <NewRoomComponent
       rooms = {rooms}
       setRooms = {setRooms}
       currentUser={currentUser}
       />
      {rooms.length > 0 ? (
        rooms.map((sala, index) => (
          <div
            key={index}
            className="landingLiveContainer"
            onClick={() => openLive({ currentUser, sala, navigate })}
          >
            {/* div for the image */}
            <div
              className={`landingLiveImage ${sala.isLive ? "neon" : ""}`} // 👈 pinta neon
              style={{
                backgroundImage: `url(${sala.roomImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {" "}
            </div>

            {/* div for the room title */}
            <div className="landingLiveTitle">
              <p className="roomTitleText">{sala.roomTitle}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No rooms available. Please create one!</p>
      )}
    </div>
  );
};

export default Salas2;
