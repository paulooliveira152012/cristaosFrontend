import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import "../styles/settingsMenu.css";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import {
  handleUpdate,
  handleDeleteAccount,
  handleImagePicker,
} from "./functions/updateFunctions";

const SettingsMenu = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, logout } = useUser();
  const [updateMessage, setUpdateMessage] = useState("")
  const [displayModal, setDisplayModal] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profileImage: "",
    newPassword: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || "",
        email: currentUser.email || "",
        profileImage: currentUser.profileImage || "",
        newPassword: "",
      });
    }
  }, [currentUser]);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [settingsType, setSettingsType] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!currentUser) {
    navigate("/");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  console.log("currentUser:", currentUser);

  return (
    <div>
      {displayModal && (
      <div className="modal">
        <div className="modal-content">
          <p>{updateMessage}</p>
        </div>
      </div>
      )}
      <Header showProfileImage={false} navigate={navigate} />
      <div className="settingsMenu">
        <h2>Configurações</h2>

        <select
          value={settingsType}
          onChange={(e) => setSettingsType(e.target.value)}
        >
          <option value="">Selecione uma opção</option>
          <option value="accountConfigurations">Configurações de conta</option>
          <option value="profileConfigurations">Configurações de perfil</option>
        </select>

        {settingsType === "accountConfigurations" && (
          <>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            <label>Senha atual:</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />

            <label>Nova senha:</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />

            <label>Confirmar nova senha:</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />

            <button
              onClick={() =>
                handleUpdate({
                  formData,
                  file,
                  currentUser,
                  setCurrentUser,
                  setMessage,
                  setLoading,
                  passwordData,
                  setUpdateMessage,
                  setDisplayModal,
                  navigate
                })
              }
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>

            <hr />

            <button
              onClick={() => handleDeleteAccount({ currentUser, logout })}
              className="danger"
            >
              ❌ Deletar minha conta
            </button>
          </>
        )}

        {settingsType === "profileConfigurations" && (
          <>
            <label>Nome de usuário:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />

            <label>Imagem de perfil:</label>
            <div
              onClick={() =>
                handleImagePicker({
                  setFormData,
                  setFile,
                })
              }
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                backgroundImage: `url(${
                  formData.profileImage || "https://via.placeholder.com/150"
                })`,
                border: "2px solid black",
                backgroundSize: "cover",
                backgroundPosition: "center",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            />

            <button
              onClick={() =>
                handleUpdate({
                  formData,
                  file,
                  currentUser,
                  setCurrentUser,
                  setMessage,
                  setLoading,
                  passwordData,
                  setUpdateMessage,
                  setDisplayModal,
                  navigate
                })
              }
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </>
        )}

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </div>
    </div>
  );
};

export default SettingsMenu;
