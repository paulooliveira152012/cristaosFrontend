// NewRoomComponent.jsx
import React, { useState } from "react";
import NewChat from "../../assets/icons/newchatIcon";
import { NewRoomModal } from "./NewRoomModal";
import { useUser } from "../../context/UserContext";

export const NewRoomComponent = ({ rooms, setRooms }) => {
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [coverImage, setCoverImage] = useState(null);

  return (
    <div
      className="landingLiveNewRoomContainer"
      onClick={() => {
        console.log("testing");
        setShowModal(true);
      }}
    >
      {/* renderiza o modal só quando precisar */}
      {showModal && (
        <NewRoomModal
          currentUser={currentUser}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          roomTitle={roomTitle}
          setShowModal={setShowModal}
          setRoomTitle={setRoomTitle}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
          rooms={rooms}
          setRooms={setRooms}
        />
      )}
      <NewChat className="newChatIcon" />
    </div>
  );
};
