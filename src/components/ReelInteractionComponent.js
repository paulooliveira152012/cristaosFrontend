import React, { useState, useCallback, useEffect } from "react";
import "../styles/reels.css";
import { likeAction, saveAction, commentAction, shareAction } from "./functions/reelsInteractionFunctions";

const ReelInteractionComponent = ({
  reelId,
  currentUserId,
  url,
  onOpen,                // (reelId, comments) => void  ou (comments) => void
  likes = false,         // <- boolean: usuário curtiu?
  likesCount = 0,        // <- number: total de likes
  saved = false,         // <- boolean: usuário salvou?
}) => {
  const [liked, setLiked] = useState(!!likes);
  const [likeQty, setLikeQty] = useState(Number.isFinite(likesCount) ? likesCount : 0);
  const [isSaved, setIsSaved] = useState(!!saved);
  const [busy, setBusy] = useState({ like: false, save: false, share: false, comment: false });

  // Re-sync quando mudar de reel ou props externas
  useEffect(() => {
    setLiked(!!likes);
    setLikeQty(Number.isFinite(likesCount) ? likesCount : 0);
    setIsSaved(!!saved);
  }, [reelId, likes, likesCount, saved]);

  const canInteract = Boolean(currentUserId);

  const handleLike = useCallback(async () => {
    if (!canInteract || busy.like) return;
    setBusy(b => ({ ...b, like: true }));
    try {
      // otimista
      setLiked(prev => !prev);
      setLikeQty(q => (liked ? Math.max(0, q - 1) : q + 1));

      const res = await likeAction({ reelId, userId: currentUserId });
      if (res) {
        if (typeof res.liked === "boolean") setLiked(res.liked);
        if (typeof res.likesCount === "number") setLikeQty(res.likesCount);
      }
    } catch {
      // rollback pro que veio de fora
      setLiked(!!likes);
      setLikeQty(Number.isFinite(likesCount) ? likesCount : 0);
    } finally {
      setBusy(b => ({ ...b, like: false }));
    }
  }, [canInteract, busy.like, reelId, currentUserId, liked, likes, likesCount]);

  const handleSave = useCallback(async () => {
    if (!canInteract || busy.save) return;
    setBusy(b => ({ ...b, save: true }));
    try {
      // otimista
      setIsSaved(prev => !prev);
      const res = await saveAction({ reelId, userId: currentUserId });
      if (res && typeof res.saved === "boolean") setIsSaved(res.saved);
    } catch {
      setIsSaved(!!saved);
    } finally {
      setBusy(b => ({ ...b, save: false }));
    }
  }, [canInteract, busy.save, reelId, currentUserId, saved]);

  const handleComment = useCallback(async () => {
    if (!canInteract || busy.comment) return;
    setBusy(b => ({ ...b, comment: true }));
    try {
      const data = await commentAction({ reelId, userId: currentUserId });
      const comments = Array.isArray(data?.comments) ? data.comments : data || [];
      if (onOpen?.length === 2) onOpen(reelId, comments);
      else onOpen?.(comments);
    } finally {
      setBusy(b => ({ ...b, comment: false }));
    }
  }, [canInteract, busy.comment, reelId, currentUserId, onOpen]);

  const handleShare = useCallback(async () => {
    if (!canInteract || busy.share) return;
    setBusy(b => ({ ...b, share: true }));
    try {
      await shareAction({ reelId, userId: currentUserId, url });
    } finally {
      setBusy(b => ({ ...b, share: false }));
    }
  }, [canInteract, busy.share, reelId, currentUserId, url]);

  return (
    <div className="ReelInteractionComponentWrapper">
      <ul>
        <li
          role="button"
          tabIndex={0}
          aria-pressed={liked}
          onClick={handleLike}
          style={{ opacity: busy.like || !canInteract ? 0.6 : 1, pointerEvents: busy.like ? "none" : "auto" }}
          title={!canInteract ? "Faça login para curtir" : undefined}
        >
          {liked ? "liked" : "like"}{Number.isFinite(likeQty) ? ` (${likeQty})` : ""}
        </li>

        <li
          role="button"
          tabIndex={0}
          onClick={handleComment}
          style={{ opacity: busy.comment || !canInteract ? 0.6 : 1, pointerEvents: busy.comment ? "none" : "auto" }}
          title={!canInteract ? "Faça login para comentar" : undefined}
        >
          comment
        </li>

        <li
          role="button"
          tabIndex={0}
          onClick={handleShare}
          style={{ opacity: busy.share || !canInteract ? 0.6 : 1, pointerEvents: busy.share ? "none" : "auto" }}
          title={!canInteract ? "Faça login para compartilhar" : undefined}
        >
          share
        </li>
      </ul>

      <li
        role="button"
        tabIndex={0}
        onClick={handleSave}
        aria-pressed={isSaved}
        style={{ opacity: busy.save || !canInteract ? 0.6 : 1, pointerEvents: busy.save ? "none" : "auto" }}
        title={!canInteract ? "Faça login para salvar" : undefined}
      >
        {isSaved ? "saved" : "save"}
      </li>
    </div>
  );
};

export default ReelInteractionComponent;
