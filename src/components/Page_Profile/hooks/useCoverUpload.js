// hooks/useCoverUpload.js
import { useRef, useState, useCallback } from "react";
import { coverSelected } from "../../../pages/functions/profilePageFunctions";

export function useCoverUpload(setUser, isOwner) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const triggerSelect = useCallback(() => {
    if (!isOwner) return;
    fileRef.current?.click();
  }, [isOwner]);

  const onChange = useCallback(
    (e) => coverSelected(e, setUploading, setUser),
    [setUser]
  );

  return { fileRef, uploading, triggerSelect, onChange };
}
