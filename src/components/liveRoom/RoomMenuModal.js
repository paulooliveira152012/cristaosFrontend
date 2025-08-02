const RoomMenuModal = ({
    setShowSettingsModal,
    newRoomTitle,
    setNewRoomTitle,
    handleUpdateRoomTitle,
    handleDeleteRoom
} 
) => {
    return (
        <div
          className="modal-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Room Settings</h2>
            <label htmlFor="newRoomTitle">Novo Titulo</label>
            <input
              type="text"
              id="newRoomTitle"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="Enter new room title"
            />
            <button onClick={handleUpdateRoomTitle}>Edit Room Title</button>
            <button onClick={handleDeleteRoom}>Delete Room</button>
            <button onClick={() => setShowSettingsModal(false)}>Close</button>
          </div>
        </div>
    )
}

export default RoomMenuModal