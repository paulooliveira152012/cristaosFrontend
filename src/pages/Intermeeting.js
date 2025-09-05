// src/pages/Intermeeting.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { fetchMeetingInfo } from "./functions/intermeetings";
// Reaproveita os estilos da página de igreja (classes ch-*)
import "../styles/church.css";

/* Seção reutilizável com o mesmo layout da Church.jsx */
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

/* helpers */
const normalizeWebsite = (w) =>
  !w
    ? ""
    : w.startsWith("http://") || w.startsWith("https://")
    ? w
    : `https://${w}`;

const buildMapsUrl = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return "";
  const [lng, lat] = coords; // [lng, lat]
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

const formatWhen = (dt) => {
  if (!dt) return "";
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    // Ajuste o locale conforme desejar
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
};

const Intermeeting = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

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

  // Mapeia dados do schema para a UI
  const view = useMemo(() => {
    if (!meeting) return null;

    const website = normalizeWebsite(meeting.website || "");
    const coords = meeting.location?.coordinates; // [lng, lat]
    const mapsUrl = buildMapsUrl(coords);

    return {
      id: meeting._id,
      name: meeting.name,
      summary: meeting.summary || "",
      address: meeting.address || "",
      whenISO: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString() : null,
      whenText: meeting.meetingDate ? formatWhen(meeting.meetingDate) : "",
      website,
      coords,      // [lng, lat]
      mapsUrl,
    };
  }, [meeting]);

  if (loading)
    return (
      <div className="page">
        <p>Carregando reunião...</p>
      </div>
    );
  if (error)
    return (
      <div className="page">
        <p style={{ color: "#c00" }}>{error}</p>
      </div>
    );
  if (!view)
    return (
      <div className="page">
        <p>Reunião não encontrada.</p>
      </div>
    );

  return (
    <>
      <Header
        showProfileImage={false}
        onBack={() => navigate(-1)}
        className="headerChurch"
      />

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
                  <a
                    className="ch-btn"
                    href={view.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site oficial
                  </a>
                )}
                {view.mapsUrl && (
                  <a className="ch-btn ch-btn--ghost" href="#como-chegar">
                    Como chegar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações principais */}
        <Section title="Informações">
          <div className="ch-grid2">
            <div>
              <h3>Quando</h3>
              {view.whenText ? (
                <p>{view.whenText}</p>
              ) : (
                <p className="ch-note">Data/horário não informados.</p>
              )}
            </div>

            <div>
              <h3>Endereço</h3>
              {view.address ? (
                <p>{view.address}</p>
              ) : (
                <p className="ch-note">Endereço não informado.</p>
              )}

              <div className="ch-links" style={{ marginTop: 8 }}>
                {view.mapsUrl && (
                  <a
                    id="como-chegar"
                    href={view.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
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

        {/* Sobre / descrição */}
        <Section title="Sobre esta reunião">
          {view.summary ? (
            <p>{view.summary}</p>
          ) : (
            <div className="ch-note">Sem descrição adicional.</div>
          )}
        </Section>
      </div>
    </>
  );
};

export default Intermeeting;
