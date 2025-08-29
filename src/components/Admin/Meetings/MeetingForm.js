// components/Admin/Meetings/MeetingForm.jsx
import React, { useState, useEffect } from "react";

const EMPTY = {
  name: "",
  summary: "",
  address: "",
  website: "",
  meetingDate: "", // string "YYYY-MM-DDThh:mm"
  lng: "",
  lat: "",
};

// ==== util: Mapbox geocoding (client-side) ====
async function geocodeWithMapbox(address, token = process.env.REACT_APP_MAPBOX_TOKEN) {
  if (!address?.trim()) throw new Error("Endereço vazio");
  if (!token) throw new Error("MAPBOX token ausente (REACT_APP_MAPBOX_TOKEN)");

  const base = "https://api.mapbox.com/geocoding/v5/mapbox.places";
  const q = encodeURIComponent(address);
  const params = new URLSearchParams({ access_token: token, limit: "1", country: "BR,US" });

  const res = await fetch(`${base}/${q}.json?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

  const data = await res.json();
  const f = data?.features?.[0];
  if (!f?.center?.length) throw new Error("Endereço não encontrado");
  const [lng, lat] = f.center;
  return { lng, lat, place: f.place_name };
}

// Converte Date/ISO -> string "YYYY-MM-DDThh:mm"
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

  // estados de geocoding
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setForm(EMPTY);
      return;
    }
    const base = { ...EMPTY, ...initialValues };

    // se vier GeoJSON do backend
    if (
      initialValues.location?.type === "Point" &&
      Array.isArray(initialValues.location.coordinates) &&
      initialValues.location.coordinates.length === 2
    ) {
      base.lng = initialValues.location.coordinates[0];
      base.lat = initialValues.location.coordinates[1];
    }

    if (initialValues.meetingDate) {
      base.meetingDate = toDatetimeLocalString(initialValues.meetingDate);
    }

    setForm(base);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // chama o Mapbox para preencher lng/lat a partir do endereço
  const geocodeAddress = async () => {
    if (!form.address?.trim()) return;
    setGeoLoading(true);
    setGeoError("");
    try {
      const { lng, lat, place } = await geocodeWithMapbox(form.address);
      setForm((s) => ({
        ...s,
        lng: String(lng),
        lat: String(lat),
        address: place || s.address, // opcional: normaliza o texto
      }));
    } catch (e) {
      setGeoError(e.message || "Falha ao geocodificar");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Preencha o nome do encontro.");
      return;
    }
    if (form.lng === "" || form.lat === "") {
      alert("Preencha longitude e latitude (ou use 'Buscar coords').");
      return;
    }

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
        style={{width: "50%"}}
      />

      {/* Endereço + buscar coords */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          name="address"
          placeholder="Endereço (texto livre)"
          value={form.address}
          onChange={handleChange}
          onBlur={geocodeAddress}          // <- dispara ao sair do campo
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geoLoading || !form.address?.trim()}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: geoLoading ? "#ddd" : "#000",
            color: "#fff",
            width: "50%"
          }}
        >
          {geoLoading ? "Buscando..." : "Buscar coords"}
        </button>
      </div>
      {!!geoError && <div style={{ color: "#b00020", fontSize: 12 }}>{geoError}</div>}

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
