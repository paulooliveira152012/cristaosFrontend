const baseUrl = process.env.REACT_APP_API_BASE_URL

export const getAllUsers = async (setAllUsers) => {
    // console.log("getting all users...")
    // console.log("api:", baseUrl)

    const res = await fetch(`${baseUrl}/api/users/getAllUsers`, {
        method: "GET",
    })

    const data = await res.json()
    setAllUsers(data.users)
    // console.log("allUsers:", data)
}

// Busca os amigos do usuário e devolve um Set de IDs (string)
export async function getFriendIds(userId) {
    console.log("getting friends for", userId);
  const res = await fetch(`${baseUrl}/api/users/${userId}/friends`, {
    method: "GET",
    credentials: "include", // importante p/ cookie/jwt
  });
  if (!res.ok) throw new Error("Falha ao buscar amigos");

  const data = await res.json();

  console.log("friends:", data);
  // O back pode retornar { friends: [...] } com objetos (populate) ou só ids.
  const list = Array.isArray(data?.friends) ? data.friends : data;

  // Normaliza: pega _id se existir, senão o próprio valor
  const ids = list.map((f) => String(f?._id ?? f));
  return new Set(ids);
}