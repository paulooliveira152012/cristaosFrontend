import { useState, useEffect, useCallback } from "react";
const API = process.env.REACT_APP_API_BASE_URL;

export const MembersManager = ({ church, onClose = () => {} }) => {
  const churchId = church?._id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");

  const load = useCallback(
    async (id) => {
      if (!id) return;           // guarda: sem churchId não faz nada
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/churches/${id}/members`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // aceita tanto array direto quanto { members: [...] }
        setMembers(Array.isArray(data) ? data : data?.members || []);
      } catch (err) {
        console.error("Falha ao carregar membros:", err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!churchId) return;       // evita acessar church._id quando undefined
    load(churchId);
  }, [churchId, load]);

  const add = async (e) => {
    e.preventDefault();
    if (!churchId) return;       // guarda
    const res = await fetch(`${API}/api/churches/${churchId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) return alert("Falha ao adicionar");
    setUserId("");
    setRole("member");
    load(churchId);
  };

  const remove = async (membershipId) => {
    if (!window.confirm("Remover este membro?")) return;
    const res = await fetch(`${API}/api/churches/members/${membershipId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return alert("Falha ao remover");
    load(churchId);
  };

  // Se ainda não tem igreja selecionada, mostra um placeholder seguro
  if (!churchId) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Membros — selecione uma igreja</h3>
          <button className="text-sm underline" onClick={onClose}>fechar</button>
        </div>
        <p className="text-sm text-gray-600">Nenhuma igreja selecionada.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Membros — {church?.name}</h3>
        <button className="text-sm underline" onClick={onClose}>fechar</button>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-3">
        <input
          className="border p-2 rounded flex-1 min-w-[220px]"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <select
          className="border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="member">member</option>
          <option value="leader">leader</option>
          <option value="pastor">pastor</option>
          <option value="admin">admin</option>
        </select>
        <button className="px-4 py-2 rounded bg-black text-white">Adicionar</button>
      </form>

      {loading ? (
        <p>Carregando membros...</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Usuário</th>
                <th className="text-left p-2">Papel</th>
                <th className="text-left p-2">Desde</th>
                <th className="text-left p-2"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-b">
                  <td className="p-2">
                    {m.user?.username || m.user?.name || m.user?._id || "—"}
                  </td>
                  <td className="p-2">{m.role || "—"}</td>
                  <td className="p-2">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white"
                      onClick={() => remove(m._id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td className="p-2" colSpan={4}>
                    Nenhum membro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
