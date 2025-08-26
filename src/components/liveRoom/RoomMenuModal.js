import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/liveRoom.css";

const RoomMenuModal = ({
  setShowSettingsModal,
  newRoomTitle,
  setNewRoomTitle,
  handleUpdateRoomTitle,
  handleDeleteRoom,
  onChooseCover,
  currentCoverUrl = "",
  isLoading = false, // vem do pai
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentCoverUrl);

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
    onChooseCover?.(f);
    e.target.value = "";
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!isLoading) setShowSettingsModal(false); }} // não fecha durante loading
    >
      {/* overlay de LOADING global, centralizado na tela */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"              // <- cobre a viewport
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="saving-card"
              initial={{ scale: 0.96, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 6 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1.1 }}
                style={{ marginBottom: 10, opacity: 0.9 }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.2"
                />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="56"
                  strokeDashoffset="40"
                  animate={{ strokeDashoffset: [56, 20, 56] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                />
              </motion.svg>
              <div style={{ fontWeight: 600 }}>Salvando alterações…</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* seu card do modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()} aria-busy={isLoading}>
        <h2>Room Settings</h2>

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ width: 220, borderRadius: 8, display: "block", margin: "0 auto 12px" }}
          />
        )}

        <label htmlFor="newRoomTitle">Novo Título</label>
        <input
          type="text"
          id="newRoomTitle"
          value={newRoomTitle}
          onChange={(e) => setNewRoomTitle(e.target.value)}
          placeholder="Enter new room title"
          disabled={isLoading}
        />

        <div style={{ margin: "12px 0" }}>
          <label htmlFor="coverInput">Nova capa</label><br />
          <input
            id="coverInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>

        <button onClick={handleUpdateRoomTitle} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={handleDeleteRoom} disabled={isLoading}>Excluir sala</button>
        <button onClick={() => setShowSettingsModal(false)} disabled={isLoading}>Fechar</button>
      </div>
    </div>
  );
};

export default RoomMenuModal;
