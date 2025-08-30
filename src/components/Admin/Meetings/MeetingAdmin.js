// components/meetings/MeetingAdmin.jsx
import React, { useEffect, useState } from "react";
import MeetingForm from "./MeetingForm";
import MeetingList from "./MeetingList";
import MeetingEditModal from "./MeetingEditModal";
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../functions/MeetingsFunctions";

export const MeetingAdmin = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

    const load = async () => {
    try {
      setLoading(true);
      const arr = await getMeetings(); // agora já vem normalizado
      setMeetings(arr);
    } catch (e) {
      console.error(e);
      alert("Não foi possível carregar as reuniões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    try {
      const created = await createMeeting(payload);
      setMeetings((s) => [created, ...s]);
      setCreating(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao criar reunião");
    }
  };

  const handleUpdate = async (payload) => {
    console.log("atualizando...")
    try {
      const id = editing._id || editing.id;
      const updated = await updateMeeting(id, payload);
      setMeetings((s) => s.map((m) => ((m._id || m.id) === id ? updated : m)));
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar reunião");
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Deletar "${m.name}"?`)) return;
    try {
      const id = m._id || m.id;
      await deleteMeeting(id);
      setMeetings((s) => s.filter((x) => (x._id || x.id) !== id));
    } catch (e) {
      console.error(e);
      alert("Erro ao deletar reunião");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Gerenciar Reuniões</h2>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setCreating((v) => !v)}>
          {creating ? "Fechar criação" : "Adicionar reunião"}
        </button>
        <button onClick={load} disabled={loading}>
          {loading ? "Carregando..." : "Recarregar"}
        </button>
      </div>

      {creating && (
        <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Nova reunião</h3>
          <MeetingForm
            submitLabel="Criar"
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <MeetingList
          items={meetings}
          onEdit={(m) => setEditing(m)}
          onDelete={handleDelete}
        />
      )}

      <MeetingEditModal open={!!editing} onClose={() => setEditing(null)}>
        <MeetingForm
          initialValues={editing || undefined}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </MeetingEditModal>
    </div>
  );
};
