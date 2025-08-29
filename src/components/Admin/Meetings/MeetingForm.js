// components/meetings/MeetingForm.jsx
import React, { useState, useEffect } from "react";

const EMPTY = {
  name: "",
  summary: "",
  address: "",
  website: "",
  meetingDate: "", // usado no <input type="datetime-local">
  lng: "",
  lat: "",
};

// Converte Date/ISO -> string "YYYY-MM-DDThh:mm" aceita pelo input datetime-local
function toDatetimeLocalString(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function MeetingForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!initialValues) {
      setForm(EMPTY);
      return;
    }

    // base com valores padrões + dados recebidos
    const base = { ...EMPTY, ...initialValues };

    // Se vier location GeoJSON do backend, extrai lng/lat
    if (
      initialValues.location?.type === "Point" &&
      Array.isArray(initialValues.location.coordinates) &&
      initialValues.location.coordinates.length === 2
    ) {
      base.lng = initialValues.location.coordinates[0];
      base.lat = initialValues.location.coordinates[1];
    }

    // Formata meetingDate (ISO) para o input datetime-local
    if (initialValues.meetingDate) {
      base.meetingDate = toDatetimeLocalString(initialValues.meetingDate);
    }

    setForm(base);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    console.log("submiring form 1")
    e.preventDefault();

    if (!form.name) {
      alert("Preencha o nome do encontro.");
      return;
    }
    if (form.lng === "" || form.lat === "") {
      alert("Preencha longitude e latitude.");
      return;
    }

    // Envia o objeto como está; o mapeamento final (GeoJSON/ISO) é feito na função create/update
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
      <input
        name="name"
        placeholder="Nome do encontro (ex: Culto no Parque)"
        value={form.name}
        onChange={handleChange}
      />

      <textarea
        name="summary"
        placeholder="Resumo / Observações"
        value={form.summary}
        onChange={handleChange}
        rows={3}
      />

      <input
        name="address"
        placeholder="Endereço (texto livre)"
        value={form.address}
        onChange={handleChange}
      />

      <input
        type="url"
        name="website"
        placeholder="Website (opcional)"
        value={form.website}
        onChange={handleChange}
      />

      <input
        type="datetime-local"
        name="meetingDate"
        value={form.meetingDate}
        onChange={handleChange}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <input
          name="lng"
          type="number"
          step="any"
          placeholder="Longitude (ex: -46.633309)"
          value={form.lng}
          onChange={handleChange}
        />
        <input
          name="lat"
          type="number"
          step="any"
          placeholder="Latitude (ex: -23.55052)"
          value={form.lat}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
