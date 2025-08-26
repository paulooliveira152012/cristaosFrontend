import { useState, useEffect } from "react";
import "../../styles/liveRoom.css";

const RoomMenuModal = ({
  setShowSettingsModal,
  newRoomTitle,
  setNewRoomTitle,
  handleUpdateRoomTitle,
  handleDeleteRoom,
  onChooseCover, // <- recebe o File selecionado (ex: setNewCover no pai)
  currentCoverUrl = "", // <- URL atual da capa (string)
}) => {
  const [file, setFile] = useState(null); // File novo (ou null)
  const [preview, setPreview] = useState(currentCoverUrl); // string para <img>

  useEffect(() => {
    if (!file) {
      setPreview(currentCoverUrl || "");
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file, currentCoverUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Escolha uma imagem");
    setFile(f);
    onChooseCover?.(f); // avisa o pai com o File
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  };

  return (
    <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Room Settings</h2>

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: 220,
              borderRadius: 8,
              display: "block",
              marginBottom: 12,
              margin: "auto",
            }}
          />
        )}

        <label htmlFor="newRoomTitle">Novo Título</label>
        <input
          type="text"
          id="newRoomTitle"
          value={newRoomTitle}
          onChange={(e) => setNewRoomTitle(e.target.value)}
          placeholder="Enter new room title"
        />

        <div style={{ margin: "12px 0" }}>
          <label htmlFor="coverInput">Nova capa</label>
          <br />
          <input
            id="coverInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <button onClick={handleUpdateRoomTitle}>Salvar</button>
        <button onClick={handleDeleteRoom}>Excluir sala</button>
        <button onClick={() => setShowSettingsModal(false)}>Fechar</button>
      </div>
    </div>
  );
};

export default RoomMenuModal;
