// hooks/useBioEditor.js
import { useEffect, useState, useCallback } from "react";
import { handleSaveBio } from "../../../pages/functions/profilePageFunctions";

export function useBioEditor(user, setUser) {
  const [editing, setEditing] = useState(false);
  const [bioLocal, setBioLocal] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  useEffect(() => {
    const initial = user?.bio ?? "";
    setBioLocal(initial);
    setBioDraft(initial);
  }, [user?._id, user?.bio]);

  const save = useCallback(async () => {
    const trimmed = (bioDraft || "").trim();
    setBioLocal(trimmed);
    setEditing(false);
    await handleSaveBio(trimmed);
    setUser((u) => (u ? { ...u, bio: trimmed } : u));
  }, [bioDraft, setUser]);

  return {
    editing,
    setEditing,
    bioLocal,
    setBioLocal,
    bioDraft,
    setBioDraft,
    save,
    bioText: (user?.bio ?? "").trim() || (bioLocal ?? "").trim(),
  };
}
