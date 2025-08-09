import React, { useEffect, useMemo, useState } from "react";

// Adjust this to your API base (e.g., http://localhost:4000)
const API = process.env.REACT_APP_API_BASE_URL;

const Admin = () => {
  const [tab, setTab] = useState("churches");

  return (
    <div className="min-h-screen w-full p-4 md:p-6" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <nav className="flex gap-2">
          <button
            className={`px-3 py-2 rounded ${tab === "churches" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setTab("churches")}
          >
            Igrejas
          </button>
          {/* Outras abas futuras */}
        </nav>
      </header>

      {tab === "churches" && <ChurchesAdmin />}
    </div>
  );
}

function ChurchesAdmin() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // igreja selecionada p/ editar/membros

  // form de criação/edição
  const empty = useMemo(() => ({
    name: "",
    summary: "",
    website: "",
    address: "",
    denomination: "",
    meetingTimes: "",
    imageUrl: "",
    lng: "",
    lat: "",
  }), []);

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/churches`, { credentials: "include" });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setList(data);
    } catch (e) {
      setError(e.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const startCreate = () => {
    setSelected(null);
    setForm(empty);
  };

  const startEdit = (c) => {
    setSelected(c);
    setForm({
      name: c.name || "",
      summary: c.summary || "",
      website: c.website || "",
      address: c.address || "",
      denomination: c.denomination || "",
      meetingTimes: (c.meetingTimes || []).join(", "),
      imageUrl: c.imageUrl || "",
      lng: c.location?.coordinates?.[0] ?? "",
      lat: c.location?.coordinates?.[1] ?? "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        summary: form.summary || undefined,
        website: form.website || undefined,
        address: form.address || undefined,
        denomination: form.denomination || undefined,
        meetingTimes: form.meetingTimes
          ? form.meetingTimes.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        imageUrl: form.imageUrl || undefined,
      };
      if (form.lng !== "" && form.lat !== "") {
        body.lng = Number(form.lng);
        body.lat = Number(form.lat);
      }

      const method = selected ? "PUT" : "POST";
      const url = selected
        ? `${API}/api/churches/${selected._id}`
        : `${API}/api/admChurch/registerChurch`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);

      await fetchList();
      startCreate();
    } catch (e) {
      alert(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const removeChurch = async (id) => {
    if (!window.confirm("Excluir igreja e seus vínculos?")) return;
    try {
      const res = await fetch(`${API}/api/churches/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      await fetchList();
      if (selected?._id === id) startCreate();
    } catch (e) {
      alert(e.message || "Erro ao excluir");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Coluna formulário */}
      <div className="p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">{selected ? "Editar igreja" : "Nova igreja"}</h2>
          {selected && (
            <button className="text-sm underline" onClick={startCreate}>
              cancelar edição
            </button>
          )}
        </div>

        <form className="grid gap-2" onSubmit={submit}>
          <input name="name" placeholder="Nome *" value={form.name} onChange={onChange} required className="border p-2 rounded" />
          <input name="summary" placeholder="Resumo" value={form.summary} onChange={onChange} className="border p-2 rounded" />
          <input name="website" placeholder="Website" value={form.website} onChange={onChange} className="border p-2 rounded" />
          <input name="address" placeholder="Endereço" value={form.address} onChange={onChange} className="border p-2 rounded" />
          <input name="denomination" placeholder="Denominação" value={form.denomination} onChange={onChange} className="border p-2 rounded" />
          <input name="meetingTimes" placeholder="Horários (separe por vírgula)" value={form.meetingTimes} onChange={onChange} className="border p-2 rounded" />
          <input name="imageUrl" placeholder="Imagem (URL)" value={form.imageUrl} onChange={onChange} className="border p-2 rounded" />

          <div className="grid grid-cols-2 gap-2">
            <input name="lng" placeholder="Longitude (ex: -46.63)" value={form.lng} onChange={onChange} className="border p-2 rounded" />
            <input name="lat" placeholder="Latitude (ex: -23.55)" value={form.lat} onChange={onChange} className="border p-2 rounded" />
          </div>

          <button disabled={saving} className={`mt-2 px-4 py-2 rounded text-white ${saving ? "bg-gray-400" : "bg-black"}`}>
            {selected ? (saving ? "Salvando..." : "Salvar alterações") : (saving ? "Criando..." : "Criar")}
          </button>
        </form>
      </div>

      {/* Coluna lista */}
      <div className="p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Igrejas registradas</h2>
          <a className="text-sm underline" href={`${API}/api/churches/geojson`} target="_blank" rel="noreferrer">ver GeoJSON</a>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Denom.</th>
                  <th className="text-left p-2">Membros</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.denomination || "-"}</td>
                    <td className="p-2">{c.membersCount ?? 0}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button className="px-2 py-1 rounded bg-gray-200" onClick={() => startEdit(c)}>Editar</button>
                        <button className="px-2 py-1 rounded bg-gray-200" onClick={() => setSelected({ ...c, _manage: true })}>Gerenciar membros</button>
                        <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => removeChurch(c._id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td className="p-2" colSpan={4}>Nenhuma igreja cadastrada ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selected?._manage && (
          <MembersManager church={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function MembersManager({ church, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/churches/${church._id}/members`, { credentials: "include" });
      const data = await res.json();
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [church._id]);

  const add = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/churches/${church._id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, role })
    });
    if (!res.ok) return alert("Falha ao adicionar");
    setUserId("");
    setRole("member");
    load();
  };

  const remove = async (membershipId) => {
    if (!window.confirm("Remover este membro?")) return;
    const res = await fetch(`${API}/api/churches/members/${membershipId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return alert("Falha ao remover");
    load();
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Membros — {church.name}</h3>
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
        <select className="border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
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
                  <td className="p-2">{m.user?.username || m.user?.name || m.user?._id}</td>
                  <td className="p-2">{m.role}</td>
                  <td className="p-2">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "-"}</td>
                  <td className="p-2">
                    <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => remove(m._id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td className="p-2" colSpan={4}>Nenhum membro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin