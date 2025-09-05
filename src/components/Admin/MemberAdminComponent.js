// components/Admin/Members/MembersManager.jsx
import { useState, useEffect, useMemo } from "react";
import { getAllMembers, banMember, unbanMember } from "../../functions/leaderFunctions";
import { useUser } from "../../context/UserContext";

export const MembersManager = () => {
  const { currentUser } = useUser() ?? {};
  const amLeader = !!(currentUser?.role === "leader" || currentUser?.leader);
  const myId = currentUser?._id;

  const [members, setMembers] = useState([]);           // ativos (não-banidos)
  const [bannedMembers, setBannedMembers] = useState([]); // banidos
  const [leaders, setLeaders] = useState([]);           // líderes ativos
  const [selectedOption, setSelectedOption] = useState("allMembers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);       // bloqueia botão enquanto chama API

  // carregamento inicial
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!amLeader) return;
      try {
        setLoading(true);
        setError("");
        const { active, banned, leaders } = await getAllMembers({
          setMembers,
          setBannedMembers,
          isLeader: amLeader,
        });
        if (!alive) return;
        setMembers(active);
        setBannedMembers(banned);
        setLeaders(leaders);
      } catch (e) {
        if (alive) setError(e?.message || "Falha ao carregar membros");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [amLeader]);

  // lista a exibir
  const listToShow = useMemo(() => {
    switch (selectedOption) {
      case "leaders": return leaders;
      case "banned":  return bannedMembers;
      default:        return members; // "allMembers"
    }
  }, [selectedOption, leaders, bannedMembers, members]);

  // ações
  const handleBan = async (u) => {
    if (!amLeader) return;
    if (!u?._id) return;
    if (u._id === myId) return alert("Você não pode banir a si mesmo.");
    if (u.role === "leader" || u.leader) return alert("Não é possível banir um líder.");

    setActingId(u._id);
    const prevMembers = members, prevBanned = bannedMembers, prevLeaders = leaders;
    try {
      // otimista: move u para banidos
      setMembers((arr) => arr.filter((x) => x._id !== u._id));
      setLeaders((arr) => arr.filter((x) => x._id !== u._id));
      setBannedMembers((arr) => [{ ...u, isBanned: true }, ...arr]);

      await banMember({ isLeader: amLeader, userId: u._id });
    } catch (e) {
      // desfaz em caso de erro
      setMembers(prevMembers);
      setBannedMembers(prevBanned);
      setLeaders(prevLeaders);
      alert(e?.message || "Erro ao banir membro.");
    } finally {
      setActingId(null);
    }
  };

  const handleUnban = async (u) => {
    if (!amLeader) return;
    if (!u?._id) return;

    setActingId(u._id);
    const prevMembers = members, prevBanned = bannedMembers, prevLeaders = leaders;
    try {
      // otimista: move u para ativos
      setBannedMembers((arr) => arr.filter((x) => x._id !== u._id));
      const unbanned = { ...u, isBanned: false };
      setMembers((arr) => [unbanned, ...arr]);
      // se ele era líder (campo pode vir do back), recoloca na lista de líderes
      if (u.role === "leader" || u.leader) {
        setLeaders((arr) => [unbanned, ...arr]);
      }

      await unbanMember({ isLeader: amLeader, userId: u._id });
    } catch (e) {
      setMembers(prevMembers);
      setBannedMembers(prevBanned);
      setLeaders(prevLeaders);
      alert(e?.message || "Erro ao desbanir membro.");
    } finally {
      setActingId(null);
    }
  };

  if (!amLeader) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Gerenciar Membros</h2>
        <p style={{ color: "#b00020" }}>Apenas líderes podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Gerenciar Membros</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Visualizar:&nbsp;
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="allMembers">Todos</option>
            <option value="leaders">Líderes</option>
            <option value="banned">Banidos</option>
          </select>
        </label>

        <div style={{ fontSize: 12, opacity: .8 }}>
          Ativos: {members.length} • Líderes: {leaders.length} • Banidos: {bannedMembers.length}
        </div>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {!loading && !error && (
        <>
          {!listToShow?.length ? (
            <p>Nenhum usuário para exibir.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {listToShow.map((u) => {
                const isMe = u._id === myId;
                const isLeaderUser = u.role === "leader" || u.leader;
                return (
                  <li
                    key={u._id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <img
                      src={u.profileImage || "/avatar-placeholder.png"}
                      alt={u.username || "Usuário"}
                      width={40}
                      height={40}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {u.username || "—"}{" "}
                        {isLeaderUser && <span style={{ fontSize: 12, opacity: .7 }}>(líder)</span>}
                        {isMe && <span style={{ fontSize: 12, opacity: .7 }}> — você</span>}
                      </div>
                    </div>

                    {/* Ações */}
                    {!u.isBanned ? (
                      <button
                        disabled={actingId === u._id || isLeaderUser || isMe}
                        onClick={() => handleBan(u)}
                        style={{ background: "#b00020", color: "#fff", borderRadius: 8, padding: "6px 10px", width: "20%" }}
                      >
                        {actingId === u._id ? "Banindo..." : "Banir"}
                      </button>
                    ) : (
                      <button
                        disabled={actingId === u._id}
                        onClick={() => handleUnban(u)}
                        style={{ background: "#0a7", color: "#fff", borderRadius: 8, padding: "6px 10px", width: "20%" }}
                      >
                        {actingId === u._id ? "Desbanindo..." : "Desbanir"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
