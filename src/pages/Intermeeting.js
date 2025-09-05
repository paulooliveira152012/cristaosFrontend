// src/pages/Intermeeting.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { fetchMeetingInfo, fetchMeetingAttendees, rsvpMeeting } from "./functions/intermeetings";
import "../styles/church.css";

function Section({ title, children, actions }) {
  return (
    <section className="ch-section">
      <header className="ch-section__header">
        <h2>{title}</h2>
        {!!actions && <div className="ch-section__actions">{actions}</div>}
      </header>
      <div className="ch-section__content">{children}</div>
    </section>
  );
}

const normalizeWebsite = (w) =>
  !w ? "" : w.startsWith("http") ? w : `https://${w}`;

const buildMapsUrl = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return "";
  const [lng, lat] = coords;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

const formatWhen = (dt) => {
  if (!dt) return "";
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
};

const Intermeeting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  // presença
  const [attendees, setAttendees] = useState([]);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [imGoing, setImGoing] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchMeetingInfo(id);
        if (!cancelled) setMeeting(data);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Falha ao carregar a reunião");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // carrega lista de presença (precisa do usuário logado para saber imGoing)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await fetchMeetingAttendees(id, { limit: 30 });
        if (cancelled) return;
        if (out?.ok) {
          setAttendees(out.items || []);
          setAttendeesCount(out.count || 0);
          setImGoing(!!out.imGoing);
        } else {
          // caso GET sem protect: ainda dá pra mostrar a lista (sem imGoing)
          setAttendees(out.items || []);
          setAttendeesCount(out.count || 0);
        }
      } catch {
        // se o endpoint exigir login e o usuário não estiver logado, ignore
      }
    })();
    return () => { cancelled = true; };
  }, [id, currentUser?._id]);

  const view = useMemo(() => {
    if (!meeting) return null;
    const website = normalizeWebsite(meeting.website || "");
    const coords = meeting.location?.coordinates;
    const mapsUrl = buildMapsUrl(coords);
    return {
      id: meeting._id,
      name: meeting.name,
      summary: meeting.summary || "",
      address: meeting.address || "",
      whenISO: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString() : null,
      whenText: meeting.meetingDate ? formatWhen(meeting.meetingDate) : "",
      website,
      coords,
      mapsUrl,
    };
  }, [meeting]);

  const handleToggleRsvp = async () => {
    if (!currentUser?._id) {
      navigate("/login?next=" + encodeURIComponent(`/intermeeting/${id}`));
      return;
    }
    if (rsvpBusy) return;
    setRsvpBusy(true);
    try {
      const out = await rsvpMeeting(id, !imGoing);
      if (out?.ok) {
        setImGoing(!!out.going);
        // atualiza o contador
        setAttendeesCount(out.count ?? (out.going ? attendeesCount + 1 : Math.max(0, attendeesCount - 1)));
        // otimista: atualiza a listinha (se for “vou”, insere meu user básico; se “cancelar”, remove)
        if (out.going) {
          const me = { _id: currentUser._id, username: currentUser.username, profileImage: currentUser.profileImage || "" };
          // evita duplicata
          setAttendees((prev) => (prev.some(u => String(u._id) === String(me._id)) ? prev : [me, ...prev].slice(0, 30)));
        } else {
          setAttendees((prev) => prev.filter(u => String(u._id) !== String(currentUser._id)));
        }
      } else {
        alert(out?.message || "Não foi possível atualizar sua presença.");
      }
    } catch (e) {
      alert(e?.message || "Erro ao atualizar presença.");
    } finally {
      setRsvpBusy(false);
    }
  };

  if (loading) {
    return <div className="page"><p>Carregando reunião...</p></div>;
  }
  if (error) {
    return <div className="page"><p style={{ color: "#c00" }}>{error}</p></div>;
  }
  if (!view) {
    return <div className="page"><p>Reunião não encontrada.</p></div>;
  }

  return (
    <>
      <Header showProfileImage={false} onBack={() => navigate(-1)} className="headerChurch" />

      <div className="ch-container">
        {/* Hero */}
        <div className="ch-hero">
          <div className="ch-hero__overlay" />
          <div className="ch-hero__content">
            <h1>{view.name}</h1>
            {view.summary && <p>{view.summary}</p>}

            <div className="ch-hero__cta">
              <div>
                {view.website && (
                  <a className="ch-btn" href={view.website} target="_blank" rel="noreferrer">
                    Site oficial
                  </a>
                )}
                {view.mapsUrl && (
                  <a className="ch-btn ch-btn--ghost" href="#como-chegar">
                    Como chegar
                  </a>
                )}
              </div>

              {/* Botão de RSVP */}
              <button
                className="ch-btn"
                onClick={handleToggleRsvp}
                disabled={rsvpBusy}
                style={{ minWidth: 180 }}
              >
                {imGoing && currentUser ? "Cancelar presença" : "Vou"}
              </button>
            </div>
          </div>
        </div>

        {/* Informações principais */}
        <Section title="Informações">
          <div className="ch-grid2">
            <div>
              <h3>Quando</h3>
              {view.whenText ? <p>{view.whenText}</p> : <p className="ch-note">Data/horário não informados.</p>}
            </div>

            <div>
              <h3>Endereço</h3>
              {view.address ? <p>{view.address}</p> : <p className="ch-note">Endereço não informado.</p>}

              <div className="ch-links" style={{ marginTop: 8 }}>
                {view.mapsUrl && (
                  <a id="como-chegar" href={view.mapsUrl} target="_blank" rel="noreferrer">
                    Ver no mapa
                  </a>
                )}
                {Array.isArray(view.coords) && view.coords.length === 2 && (
                  <span className="ch-note" style={{ marginLeft: 8 }}>
                    ({view.coords[1]?.toFixed(5)}, {view.coords[0]?.toFixed(5)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Quem vai */}
        <Section
          title="Quem vai"
          actions={<span className="ch-note">{attendeesCount} confirmado(s)</span>}
        >
          {attendees.length === 0 ? (
            <div className="ch-note">Seja o primeiro a confirmar presença.</div>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {attendees.map((u) => (
                <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src={u.profileImage || "/placeholder-avatar.png"}
                    alt={u.username}
                    width={36}
                    height={36}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span>@{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Sobre */}
        <Section title="Sobre esta reunião">
          {view.summary ? <p>{view.summary}</p> : <div className="ch-note">Sem descrição adicional.</div>}
        </Section>
      </div>
    </>
  );
};

export default Intermeeting;
