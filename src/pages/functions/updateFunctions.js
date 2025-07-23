import { uploadImageToS3 } from "../../utils/s3Upload";

// 📸 Picker de imagem de perfil
export const handleImagePicker = ({ setFormData, setFile }) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFormData((prev) => ({
        ...prev,
        profileImage: URL.createObjectURL(selectedFile), // Preview local
      }));
      setFile(selectedFile); // Arquivo real para upload
    }
  };
  input.click();
};

// ✏️ Atualização de dados do usuário
export const handleUpdate = async ({
  formData,
  file,
  currentUser,
  setCurrentUser,
  setMessage,
  setLoading,
  passwordData,
  setDisplayModal,
  setUpdateMessage,
  navigate,
}) => {
  setLoading(true);

  try {
    let imageUrl = formData.profileImage;

    if (file) {
      imageUrl = await uploadImageToS3(file);
    }

    const payload = {
      ...formData,
      profileImage: imageUrl,
      ...passwordData,
    };

    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/users/update/${currentUser._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao atualizar.");

    // 💬 Verifica o que foi alterado e mostra alertas específicos
    const changes = [];

    if (passwordData?.currentPassword && passwordData?.newPassword) {
      changes.push("Senha atualizada");
    }

    if (formData.email !== currentUser.email) {
      changes.push("Atualização de email pendente, verificar via email");
    }

    if (formData.phone && currentUser.phone && formData.phone !== currentUser.phone) {
      changes.push("Telefone atualizado");
    }

    if (file) {
      changes.push("Foto de perfil atualizada");
    }

    if (formData.username !== currentUser.username) {
      changes.push("Nome de usuário atualizado");
    }

    if (formData.name !== currentUser.name) {
      changes.push("Nome completo atualizado");
    }

    if (changes.length > 0) {
      setUpdateMessage(changes.join(" · "));
      setDisplayModal(true);

      setTimeout(() => {
        setDisplayModal(false);
        navigate("/");
      }, 3000);
    }

    setCurrentUser(data.user);
    setMessage("Informações atualizadas com sucesso!");
  } catch (error) {
    setMessage(error.message);
    console.log("error:", error.message);
  } finally {
    setLoading(false);
  }
};

// ❌ Deletar conta
export const handleDeleteAccount = async ({ currentUser, logout }) => {
  console.log("Função para deletar conta...");

  if (!currentUser || !currentUser._id) {
    alert("Usuário não está autenticado.");
    return;
  }

  if (
    !window.confirm(
      "Tem certeza que deseja deletar sua conta? Essa ação não poderá ser desfeita."
    )
  )
    return;

  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/users/delete-account/${currentUser._id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) throw new Error("Erro ao deletar a conta.");

    alert("Conta deletada com sucesso.");

    logout();

    window.location.href = "/";
  } catch (error) {
    alert("Erro: " + error.message);
    console.log("Erro: " + error.message);
  }
};
