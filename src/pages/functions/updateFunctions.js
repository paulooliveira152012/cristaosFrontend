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
  passwordData, // ← adicionar aqui
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
      ...passwordData, // ← incluir as senhas aqui!
    };

    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/users/update/${currentUser._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao atualizar.");

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
    console.log("Função para deletar conta...")

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

    logout()
    
    window.location.href = "/";
  } catch (error) {
    alert("Erro: " + error.message);
    console.log("Erro: " + error.message)
  }
};
