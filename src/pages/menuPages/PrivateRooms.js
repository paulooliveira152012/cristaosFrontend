import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { uploadImageToS3 } from "../../utils/s3Upload";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

// ---------- helpers ----------
const fetchJSON = async (url, options = {}) => {
  const res = await fetch(
    url,
    { credentials: "include", ...options } // <- default inclui cookie
  );
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Resposta inválida de ${url}: ${text?.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }
  return json;
};

const normalizeRoom = (json) => json?.room ?? json; // aceita {room} ou objeto direto
const cacheBust = (url) => (url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url);

// ---------- API (com fallbacks) ----------
const apiListPrivateRooms = async () => {
  // 1) rota dedicada (se existir)
  console.log("fetching private rooms...")
  try {
    const data = await fetchJSON(`${baseUrl}/api/privateRooms/getAllRooms`);
    const rooms = data?.rooms ?? data;
    return rooms?.map(normalizeRoom) || [];
  } catch (e) {
    console.log("um erro ocorreu ao buscar salas privadas:", e);
    // 2) genérica com filtro
    const data = await fetchJSON(`${baseUrl}/api/privateRooms?isPrivate=1`);
    const rooms = data?.rooms ?? data;
    return rooms?.map(normalizeRoom) || [];
  }
}

async function apiCreatePrivateRoom({ title, password, description, imageUrl, createdBy }) {
  const body = { roomTitle: title, password, description, isPrivate: true, imageUrl, createdBy };
  console.log("body:", body);
  // 1) rota dedicada
  try {
    const data = await fetchJSON(`${baseUrl}/api/privateRooms/private`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return normalizeRoom(data);
  } catch (e) {
    // 2) rota de create genérica
    const data = await fetchJSON(`${baseUrl}/api/privateRooms/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return normalizeRoom(data);
  }
}

async function apiJoinPrivateRoom({ roomId, password }) {
  console.log("2 Tentando entrar na sala:", roomId);
  // 1) rota dedicada
  console.log("baseUrl:", baseUrl);
  try {
    const data = await fetchJSON(`${baseUrl}/api/privateRooms/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roomId, password }),
    });
    return normalizeRoom(data);
  } catch (e) {
    // 2) rota genérica com id
    const data = await fetchJSON(`${baseUrl}/api/privateRooms/join/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    return normalizeRoom(data);
  }
}

async function apiUploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const data = await fetchJSON(`${baseUrl}/api/upload`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  return data?.url;
}

// ---------- componentes auxiliares ----------
const CreateRoomModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const { currentUser } = useUser();
  console.log("currentUser:", currentUser);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = () => fileRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const b = URL.createObjectURL(f);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(b);
  };

  const handleCreate = async () => {
    setErr("");
    if (!title.trim()) return setErr("Informe um título.");
    if (password.length < 4) return setErr("Senha deve ter ao menos 4 caracteres.");
    if (password !== confirm) return setErr("As senhas não coincidem.");

    try {
      setLoading(true);
      let imageUrl = "";
      if (file) {
        // imageUrl = await apiUploadImage(file);
        imageUrl = await uploadImageToS3(file);
      }
      const room = await apiCreatePrivateRoom({ title: title.trim(), password, description, imageUrl, createdBy: currentUser._id });
      onCreated?.(room);
      onClose?.();
    } catch (e) {
      setErr(e.message || "Falha ao criar a sala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="modal-content" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px" }}>Criar sala privada</h3>

        <label style={styles.label}>Título</label>
        <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Conselho da Liderança" />

        <label style={styles.label}>Descrição (opcional)</label>
        <textarea style={styles.textarea} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição..." />

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <div
            role="button"
            tabIndex={0}
            onClick={pick}
            onKeyDown={(e) => ["Enter", " "].includes(e.key) && pick()}
            style={{
              width: 86, height: 86, borderRadius: "12px", border: "1px dashed #cfcfcf", cursor: "pointer",
              backgroundImage: preview ? `url("${preview}")` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            title="Capa da sala (opcional)"
          >
            {!preview && <span>+ capa</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
          <div style={{ fontSize: 12, opacity: 0.8 }}>Capa opcional para identificar a sala.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div>
            <label style={styles.label}>Senha</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Confirmar senha</label>
            <input style={styles.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>

        {err && <div style={{ color: "#d14343", fontSize: 12, marginTop: 8 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button style={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={styles.btn} onClick={handleCreate} disabled={loading}>{loading ? "Criando..." : "Criar sala"}</button>
        </div>
      </div>
    </div>
  );
};

const JoinRoomModal = ({ room, onClose, onJoined, isLeader }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleJoin = async () => {
    console.log("1 Tentando entrar na sala:", room);
    setErr("");
    try {
      setLoading(true);
      // líderes pulam senha
      const joinedRoom = isLeader ? room : await apiJoinPrivateRoom({ roomId: room._id, password });
      onJoined?.(joinedRoom);
      onClose?.();
    } catch (e) {
      setErr(e.message || "Falha ao entrar na sala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="modal-content" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px" }}>Entrar na sala</h3>
        <div style={{ marginBottom: 6, fontWeight: 500 }}>{room?.roomTitle || room?.title}</div>
        {isLeader ? (
          <div style={{ fontSize: 13, color: "#0a7d28", margin: "6px 0 10px" }}>
            Você é líder — entrada liberada sem senha.
          </div>
        ) : (
          <>
            <label style={styles.label}>Senha</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}

        {err && <div style={{ color: "#d14343", fontSize: 12, marginTop: 8 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button style={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={styles.btn} onClick={handleJoin} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
};

const RoomCard = ({ room, onJoin }) => {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", gap: 10 }}>
        <div
          style={{
            width: 58, height: 58, borderRadius: 10, background: "#f2f2f2",
            backgroundImage: room?.roomImage ? `url("${room.roomImage}")` : "none",
            backgroundSize: "cover", backgroundPosition: "center",
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>{room?.roomTitle || "Sala privada"}</h3>
            <span title="Privada" aria-label="Privada" style={{ fontSize: 14 }}>🔒</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {room?.description || "Sala protegida para reuniões do grupo."}
          </div>
          <div style={{ marginTop: 8 }}>
            <button style={styles.btnSm} onClick={() => onJoin(room)}>Entrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateCard = ({ onOpen }) => {
  return (
    <div style={{ ...styles.card, borderStyle: "dashed", background: "#fcfcfc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 58, height: 58, borderRadius: 10, border: "1px dashed #cfcfcf",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>+</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Criar nova sala privada</h3>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            Defina um título, senha e (opcional) capa e descrição.
          </div>
          <div style={{ marginTop: 8 }}>
            <button style={styles.btn} onClick={onOpen}>Criar sala</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- página principal ----------
const PrivateRooms = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [joining, setJoining] = useState(null); // room selecionada para join
  const [q, setQ] = useState("");

  const isLeader =
    !!currentUser?.isLeader ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.includes("leader")) ||
    currentUser?.role === "leader";

  const load = async () => {
    try {
      setLoading(true);
      const list = await apiListPrivateRooms();
      // pequenos ajustes visuais (cache-busting)
      setRooms(list.map((r) => ({ ...r, imageUrl: cacheBust(r.imageUrl) })));
    } catch (e) {
      setErr(e.message || "Falha ao listar salas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreated = (room) => {
    setRooms((prev) => [{ ...room, imageUrl: cacheBust(room.imageUrl) }, ...prev]);
    // já entra direto na sala recem criada:
    navigate(`/liveRoom/${room._id}`, { state: { sala: room } });
  };

  const onJoined = (room) => {
    navigate(`/liveRoom/${room._id}`, { state: { sala: room } });
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return rooms;
    const s = q.trim().toLowerCase();
    return rooms.filter((r) => {
      const hay = [
        r.roomTitle || "",
        r.title || "",
        r.description || "",
      ].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [rooms, q]);

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div style={styles.container}>
        <h1 style={{ margin: "8px 0 4px" }}>Salas de Reuniões Privadas</h1>
        <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
          Crie e entre em salas privadas protegidas por senha. Líderes entram sem senha.
        </p>

        <div style={styles.toolbar}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título / descrição..."
            style={styles.input}
          />
          <button style={styles.btnGhost} onClick={load} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
          <button style={styles.btn} onClick={() => setShowCreate(true)}>Nova sala</button>
        </div>

        {err && <div style={{ color: "#d14343", marginBottom: 10 }}>{err}</div>}

        {loading ? (
          <div style={{ opacity: 0.8 }}>Carregando salas...</div>
        ) : (
          <div style={styles.grid}>
            <CreateCard onOpen={() => setShowCreate(true)} />
            {filtered.map((room) => (
              <RoomCard key={room._id} room={room} onJoin={() => setJoining(room)} />
            ))}
          </div>
        )}
      </div>


      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={onCreated}
        />
      )}
      {joining && (
        <JoinRoomModal
          room={joining}
          onClose={() => setJoining(null)}
          onJoined={onJoined}
          isLeader={isLeader}
        />
      )}
    </div>
  );
};

// ---------- estilos ----------
const styles = {
  container: { maxWidth: 1000, margin: "0 auto", padding: 16 },
  toolbar: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  input: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, minWidth: 260 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
  card: { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" },
  btn: { padding: "10px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  btnGhost: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e2e2", background: "#fff", cursor: "pointer" },
  btnSm: { padding: "8px 10px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { width: "min(560px, 94vw)", background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 14 },
  label: { display: "block", fontSize: 12, opacity: 0.8, marginTop: 8, marginBottom: 4 },
  input: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, width: "100%" },
  textarea: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, width: "100%", resize: "vertical" },
};

export default PrivateRooms;
