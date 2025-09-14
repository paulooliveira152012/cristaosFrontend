import React from "react";
import { handleCreateRoom } from "../../../pages/functions/liveRoomFunctions2";
import { uploadImageToS3 } from "../../../utils/s3Upload";
import "../../../styles/rooms.css";

export const NewRoomModal = ({
  currentUser,
  setShowModal,
  roomTitle,
  setRoomTitle,
  coverImage,
  setCoverImage,
  isLoading,
  setIsLoading,
  rooms,
  setRooms,
}) => {
  // Handle file selection
  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  return (
    <div
      className="modal"
      onClick={(e) => {
        e.stopPropagation();
        setShowModal(false);
      }}
    >
      <div className="newRoomContainer" onClick={(e) => e.stopPropagation()}>
        <form className="newRoomForm" onSubmit={(e) => e.preventDefault()}>
          <div
            onClick={() => setShowModal(false)}
            className="closeModalButtonContainer"
          >
            X
          </div>

          {/* Image file input */}
          <input
            type="file"
            accept="image/*"
            onChange={handleSelectImage}
            style={{ display: "none" }}
            id="imageUpload"
          />
          <label htmlFor="imageUpload" className="imageUploadLabel">
            <div
              className="selectedImageContainer"
              style={{
                backgroundImage: coverImage
                  ? `url(${URL.createObjectURL(coverImage)})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#ddd",
              }}
            >
              {!coverImage && <div className="circlePlaceholder"></div>}
            </div>
          </label>
          <input
            className="nomeDaSala"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            placeholder="Enter room title"
          />

          <div
            className="button"
            onClick={() =>
              handleCreateRoom({
                roomTitle,
                roomImageFile: coverImage,
                setIsLoading,
                uploadImageToS3,
                currentUser,
                setRooms,
                setShowModal,
                // toggleModal,
                // setRoomTitle,
                // setRoomImageFile,
                // openLive,
              })
            }
          >
            <p>{isLoading ? "Criando Sala..." : "Criar Sala"}</p>
          </div>
        </form>
      </div>
    </div>
  );
};
