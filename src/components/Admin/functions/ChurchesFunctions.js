// src/functions/adminPage/ChurchesFunctions.js
import { useEffect, useMemo, useCallback, useState } from "react";

/** =========================
 * Utils puros (sem hooks)
 * ========================= */

export const buildEmptyChurch = () => ({
  name: "",
  summary: "",
  website: "",
  address: "",
  denomination: "",
  meetingTimes: "",
  imageUrl: "",
  lng: "",
  lat: "",
  // Church page extra
  vision: "",
  mission: "",
  statementPdf: "",
  photos: [],
  // contatos
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  youtube: "",
  // doações
  giving_pix: "",
  giving_bank_bank: "",
  giving_bank_agency: "",
  giving_bank_account: "",
  giving_bank_type: "",
  // listas
  ministries: "",
  leadership: "",
});

export const mapChurchToForm = (c = {}) => ({
  name: c.name || "",
  summary: c.summary || "",
  website: c.website || "",
  address: c.address || "",
  denomination: c.denomination || "",
  meetingTimes: (c.meetingTimes || []).join(", "),
  imageUrl: c.imageUrl || "",
  lng: c.location?.coordinates?.[0] ?? "",
  lat: c.location?.coordinates?.[1] ?? "",
  vision: c.vision || "",
  mission: c.mission || "",
  statementPdf: c.statementPdf || "",
  photos: c.photos || [],
  phone: c.phone || "",
  whatsapp: c.whatsapp || "",
  email: c.email || "",
  instagram: c.instagram || "",
  youtube: c.youtube || "",
  giving_pix: c.giving?.pix || "",
  giving_bank_bank: c.giving?.bank?.bank || "",
  giving_bank_agency: c.giving?.bank?.agency || "",
  giving_bank_account: c.giving?.bank?.account || "",
  giving_bank_type: c.giving?.bank?.type || "",
  ministries: (c.ministries || [])
    .map((m) => (m.desc ? `${m.name}|${m.desc}` : m.name))
    .join("; "),
  leadership: (c.leadership || [])
    .map((p) => (p.role ? `${p.role}|${p.name}` : p.name))
    .join("; "),
});

export const formToRequestBody = (form) => {
  const body = {
    name: form.name,
    summary: form.summary || undefined,
    website: form.website || undefined,
    address: form.address || undefined,
    denomination: form.denomination || undefined,
    meetingTimes: form.meetingTimes
      ? form.meetingTimes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    imageUrl: form.imageUrl || undefined,
    vision: form.vision || undefined,
    mission: form.mission || undefined,
    statementPdf: form.statementPdf || undefined,
    photos: Array.isArray(form.photos) ? form.photos : [],
    phone: form.phone || undefined,
    whatsapp: form.whatsapp || undefined,
    email: form.email || undefined,
    instagram: form.instagram || undefined,
    youtube: form.youtube || undefined,
    giving:
      form.giving_pix || form.giving_bank_bank
        ? {
            pix: form.giving_pix || undefined,
            bank:
              form.giving_bank_bank || form.giving_bank_account
                ? {
                    bank: form.giving_bank_bank || undefined,
                    agency: form.giving_bank_agency || undefined,
                    account: form.giving_bank_account || undefined,
                    type: form.giving_bank_type || undefined,
                  }
                : undefined,
          }
        : undefined,
    ministries: form.ministries
      ? form.ministries
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pair) => {
            const [name, desc] = pair.split("|").map((x) => x?.trim());
            return desc ? { name, desc } : { name };
          })
      : [],
    leadership: form.leadership
      ? form.leadership
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pair) => {
            const [role, name] = pair.split("|").map((x) => x?.trim());
            return role ? { role, name } : { name };
          })
      : [],
  };

  if (form.lng !== "" && form.lat !== "") {
    body.lng = Number(form.lng);
    body.lat = Number(form.lat);
  }
  return body;
};

/** =========================
 * IO helpers (fetch/upload)
 * ========================= */

export const fetchChurchList = async ({
  setLoading,
  setError,
  setList,
  API = process.env.REACT_APP_API_BASE_URL,
}) => {
  setLoading?.(true);
  setError?.("");
  try {
    const res = await fetch(`${API}/api/church/getChurches`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data?.churches || [];
    setList?.(arr);
  } catch (e) {
    setError?.(e.message || "Erro ao carregar lista");
  } finally {
    setLoading?.(false);
  }
};

export const uploadFile = async ({
  file,
  setUploading,
  API = process.env.REACT_APP_API_BASE_URL,
}) => {
  const fd = new FormData();
  fd.append("file", file);
  setUploading?.(true);
  try {
    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Upload falhou (${res.status})`);
    const out = await res.json();
    if (!out?.url) throw new Error("Resposta de upload sem URL");
    return out.url;
  } finally {
    setUploading?.(false);
  }
};

/** =========================
 * Geocoding util (pura)
 * ========================= */

export const geocodeWithMapbox = async ({
  address,
  token = process.env.REACT_APP_MAPBOX_TOKEN,
  country = "BR,US",
  proximity = undefined, // ex.: [-46.63, -23.55]
}) => {
  if (!address?.trim()) throw new Error("Endereço vazio");
  if (!token) throw new Error("MAPBOX token ausente (REACT_APP_MAPBOX_TOKEN)");

  const base = "https://api.mapbox.com/geocoding/v5/mapbox.places";
  const q = encodeURIComponent(address);
  const params = new URLSearchParams({
    access_token: token,
    limit: "1",
    country,
  });
  if (proximity && Array.isArray(proximity) && proximity.length === 2) {
    params.set("proximity", `${proximity[0]},${proximity[1]}`);
  }

  const url = `${base}/${q}.json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
  const data = await res.json();

  const f = data?.features?.[0];
  if (!f?.center?.length) throw new Error("Endereço não encontrado");
  const [lng, lat] = f.center;
  return { lng, lat, place: f.place_name, feature: f };
};

/** =========================
 * Hook principal da página
 * ========================= */

export const useChurchesAdmin = () => {
  const API = process.env.REACT_APP_API_BASE_URL;

  // estados
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const empty = useMemo(buildEmptyChurch, []);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // estados de geocoding
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // efeito de carregar lista
  useEffect(() => {
    fetchChurchList({ setLoading, setError, setList, API });
  }, [API]);

  // handlers
  const onChange = useCallback(
    (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })),
    []
  );

  const startCreate = useCallback(() => {
    setSelected(null);
    setForm(buildEmptyChurch());
  }, []);

  const startEdit = useCallback((c) => {
    console.log("editar...")
    setSelected(c);
    setForm(mapChurchToForm(c));
  }, []);

  const handleUploadImage = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFile({ file, setUploading, API });
      setForm((f) => ({ ...f, imageUrl: url }));
    },
    [API]
  );

  const handleUploadPdf = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFile({ file, setUploading, API });
      setForm((f) => ({ ...f, statementPdf: url }));
    },
    [API]
  );

  const handleUploadPhotoToGallery = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFile({ file, setUploading, API });
      setForm((f) => ({ ...f, photos: [...(f.photos || []), url] }));
    },
    [API]
  );

  const removePhoto = useCallback((url) => {
    setForm((f) => ({
      ...f,
      photos: (f.photos || []).filter((u) => u !== url),
    }));
  }, []);

  // -------- geocoding dentro do hook --------
  const geocodeAddress = useCallback(async () => {
    if (!form.address?.trim()) return;
    setGeoLoading(true);
    setGeoError("");
    try {
      const { lng, lat, place } = await geocodeWithMapbox({
        address: form.address,
      });
      setForm((f) => ({
        ...f,
        lng: String(lng),
        lat: String(lat),
        address: place || f.address, // opcional: normalizar endereço
      }));
    } catch (e) {
      setGeoError(e.message || "Falha ao geocodificar");
    } finally {
      setGeoLoading(false);
    }
  }, [form.address]);

  // -------- submit que tenta geocodificar se necessário --------
  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        let localForm = form;

        // se não tem coords mas tem endereço, tenta geocodificar
        if ((!form.lng || !form.lat) && form.address?.trim()) {
          try {
            const { lng, lat } = await geocodeWithMapbox({
              address: form.address,
            });
            localForm = { ...form, lng: String(lng), lat: String(lat) };
            setForm(localForm); // manter UI em sincronia
          } catch (gerr) {
            console.warn("Geocode falhou, seguindo sem coordenadas:", gerr);
          }
        }

        const body = formToRequestBody(localForm);
        const method = selected ? "PUT" : "POST";
        const url = selected
          ? `${API}/api/admChurch/${selected._id}`
          : `${API}/api/admChurch/registerChurch`;

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);

        await fetchChurchList({ setLoading, setError, setList, API });
        startCreate();
      } catch (e) {
        alert(e.message || "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [API, form, selected, startCreate]
  );

  const removeChurch = useCallback(
    async (id) => {
      if (!window.confirm("Excluir igreja e seus vínculos?")) return;
      try {
        const res = await fetch(`${API}/api/churches/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        await fetchChurchList({ setLoading, setError, setList, API });
        if (selected?._id === id) startCreate();
      } catch (e) {
        alert(e.message || "Erro ao excluir");
      }
    },
    [API, selected, startCreate]
  );

  return {
    // estados
    list,
    loading,
    error,
    selected,
    form,
    saving,
    uploading,

    // geocoding
    geoLoading,
    geoError,
    geocodeAddress,

    // setters úteis (se precisar)
    setSelected,
    setForm,

    // handlers
    onChange,
    startCreate,
    startEdit,
    handleUploadImage,
    handleUploadPdf,
    handleUploadPhotoToGallery,
    removePhoto,
    submit,
    removeChurch,

    // util
    empty,
  };
};
