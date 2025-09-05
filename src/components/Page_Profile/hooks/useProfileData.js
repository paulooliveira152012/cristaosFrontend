// hooks/useProfileData.js
import { useEffect, useState } from "react";
import { fetchUserData } from "../../../pages/functions/profilePageFunctions";

export function useProfileData(userId) {
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchUserData(userId);
      setUser(data.user);
      setUserListings(data.listings);
      setError(null);
    } catch (e) {
      setError(e?.message || "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId]);

  return { user, setUser, userListings, setUserListings, loading, error, refresh };
}
