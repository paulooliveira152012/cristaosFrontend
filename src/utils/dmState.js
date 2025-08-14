// src/utils/dmState.js
export function deriveDmState(
  meId,
  participants = [],    // array de ids
  waitingUser,          // id ou null
  requester,            // id ou null (não é obrigatório p/ UI, mas deixei na assinatura)
  leavingUser           // id ou null
) {
  const me = String(meId || "");
  const parts = participants.map(String);
  const hasMe = parts.includes(me);
  const others = parts.filter((id) => id !== me);

  // 1) Ativo se há eu + outro em participants
  if (hasMe && others.length >= 1) return "ACTIVE";

  // 2) Eu sou quem precisa aceitar
  if (waitingUser && String(waitingUser) === me) return "PENDING_I_NEED_TO_ACCEPT";

  // 3) Eu convidei e estou aguardando o outro aceitar
  if (waitingUser && String(waitingUser) !== me && hasMe) return "PENDING_ME_WAITING_OTHER";

  // 4) O outro saiu, sobrou só eu
  if (!waitingUser && hasMe && others.length === 0 && leavingUser && String(leavingUser) !== me) {
    return "ALONE_CAN_REINVITE";
  }

  // fallback seguro
  return "PENDING_ME_WAITING_OTHER";
}
