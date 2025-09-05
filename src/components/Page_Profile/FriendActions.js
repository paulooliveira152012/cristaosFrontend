// components/profile/FriendActions.js
import React from "react";

/**
 * Botões de amizade no perfil visualizado.
 * Estados:
 * - Dono do perfil -> não renderiza
 * - Já amigos -> mostra "✅ Amigo" (clicar remove)
 * - Recebeu pedido -> "✅ Aceitar" e "❌ Recusar"
 * - Enviou pedido -> "⏳ Pedido enviado"
 * - Sem relação -> "+ Adicionar"
 */
const FriendActions = React.memo(function FriendActions({
  currentUser,
  profileUser,
  onSend,    // () => void
  onAccept,  // (userId) => Promise|void
  onReject,  // (userId) => Promise|void
  onRemove,  // (userId) => Promise|void
  className = "",
}) {
  if (!currentUser || !profileUser) return null;

  const isOwner = String(currentUser._id) === String(profileUser._id);
  if (isOwner) return null;

  const isFriend =
    Array.isArray(currentUser.friends) &&
    currentUser.friends.includes(profileUser._id);

  const hasSent =
    Array.isArray(currentUser.sentFriendRequests) &&
    currentUser.sentFriendRequests.includes(profileUser._id);

  const hasReceived =
    Array.isArray(currentUser.friendRequests) &&
    currentUser.friendRequests.includes(profileUser._id);

  if (isFriend) {
    return (
      <button
        type="button"
        className={`friend-pill ${className}`}
        onClick={() => onRemove?.(profileUser._id)}
      >
        ✅ Amigo
      </button>
    );
  }

  if (hasReceived) {
    return (
      <span className={className} style={{ display: "inline-flex", gap: 8 }}>
        <button
          type="button"
          className="friend-pill"
          onClick={() => onAccept?.(profileUser._id)}
        >
          ✅ Aceitar
        </button>
        <button
          type="button"
          className="friend-pill ghost"
          onClick={() => onReject?.(profileUser._id)}
        >
          ❌ Recusar
        </button>
      </span>
    );
  }

  if (hasSent) {
    return <span className={`friend-pill ${className}`}>⏳ Pedido enviado</span>;
  }

  return (
    <button
      type="button"
      className={`add-friend-btn ${className}`}
      onClick={() => onSend?.()}
    >
      + Adicionar
    </button>
  );
});

export default FriendActions;
