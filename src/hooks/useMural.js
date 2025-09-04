// src/hooks/useMural.js
import { useCallback, useEffect, useState } from "react";
// ajuste o caminho se seu profilePageFunctions estiver em outro lugar
import { getMuralContent, submitMuralContent } from "../pages/functions/profilePageFunctions";

export function useMural(profileUserId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [posting, setPosting]   = useState(false);
  const [error, setError]       = useState(null);

  const canPost =
    Boolean(currentUser?._id) &&
    Boolean(profileUserId) &&
    String(currentUser._id) !== String(profileUserId);

  const refresh = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    setError(null);
    try {
      const { items = [] } = await getMuralContent(profileUserId);
      setMessages(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Falha ao carregar mural.");
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  const post = useCallback(
    async (rawText) => {
      const text = (rawText || "").trim();
      if (!text) return { ok: false, error: "Mensagem vazia." };
      if (!canPost) return { ok: false, error: "Sem permissão para postar." };

      // otimismo: mostra a mensagem antes de confirmar no backend
      const optimistic = {
        _id: `tmp-${Date.now()}`,
        text,
        sender: currentUser
          ? {
              _id: currentUser._id,
              username: currentUser.username,
              profileImage: currentUser.profileImage,
            }
          : null,
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };

      setPosting(true);
      setError(null);
      setMessages((prev) => [optimistic, ...prev]);

      try {
        const { error, message } = await submitMuralContent(
          currentUser._id,
          profileUserId,
          text
        );
        if (error || !message) throw new Error(error || "Falha ao enviar mensagem.");

        // troca a otimista pela verdadeira
        setMessages((prev) => {
          const i = prev.findIndex((m) => m._id === optimistic._id);
          if (i === -1) return [message, ...prev];
          const next = [...prev];
          next[i] = message;
          return next;
        });

        return { ok: true, message };
      } catch (e) {
        console.error(e);
        // remove a otimista em caso de erro
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        setError(e?.message || "Falha ao enviar mensagem.");
        return { ok: false, error: e?.message || "Falha ao enviar mensagem." };
      } finally {
        setPosting(false);
      }
    },
    [canPost, currentUser, profileUserId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { messages, post, loading, posting, error, canPost, refresh };
}
