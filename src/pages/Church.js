// src/pages/Church.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import "../styles/church.css";
import { fetchChurchInfo } from "./functions/churchFunctions";

// Componente de seção reutilizável (mantém o estilo do mock)
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

// helpers
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

const Church = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [church, setChurch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchChurchInfo(id);
        if (!cancelled) setChurch(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Falha ao carregar a igreja");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Mapeia os dados reais para a estrutura da UI
  const view = useMemo(() => {
    if (!church) return null;

    const website = normalizeWebsite(church.website || "");
    const coords = church.location?.coordinates; // [lng, lat]
    const mapsUrl = buildMapsUrl(coords);

    return {
      id: church._id,
      name: church.name,
      about: {
        shortDescription: church.summary || "",
        // se você tiver campos vision/mission no schema, mapeie aqui:
        vision: church.vision || "Visão ainda não informada.",
        mission: church.mission || "Missão ainda não informada.",
        statementPdf: church.statementPdf || "",
        photos: church.photos || (church.imageUrl ? [church.imageUrl] : []),
      },
      address: {
        street: church.address || "Endereço não informado",
        district: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        lat: Array.isArray(coords) ? coords[1] : undefined,
        lng: Array.isArray(coords) ? coords[0] : undefined,
        mapsUrl,
      },
      contact: {
        phone: church.phone || "",
        whatsapp: church.whatsapp || "",
        email: church.email || "",
        website,
        instagram: church.instagram || "",
        youtube: church.youtube || "",
      },
      schedule: Array.isArray(church.meetingTimes)
        ? church.meetingTimes.map((t) => ({ day: "", time: t, type: "Culto" }))
        : [],
      ministries: church.ministries || [],
      leadership: church.leadership || [], // se usar ChurchMembers/roles, você pode popular depois
      giving: church.giving || null, // mapeie se tiver no schema
      denomination: church.denomination || "",
      coords,
    };
  }, [church]);

  if (loading)
    return (
      <div className="page">
        <p>Carregando igreja...</p>
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
        <p>Igreja não encontrada.</p>
      </div>
    );

  const toggleShowChurchMembers = () => setShowMembers((prev) => !prev);

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
          {/* opcional: se tiver imageUrl, dá pra usar como background via CSS */}
          <div className="ch-hero__overlay" />
          <div className="ch-hero__content">
            <h1>{view.name}</h1>
            {view.denomination && (
              <p style={{ opacity: 0.9 }}>{view.denomination}</p>
            )}
            {view.about.shortDescription && (
              <p>{view.about.shortDescription}</p>
            )}
            <div className="ch-hero__cta">
              <div>
                {view.contact.website && (
                  <a
                    className="ch-btn"
                    href={view.contact.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site oficial
                  </a>
                )}
                {view.address.mapsUrl && (
                  <a className="ch-btn ch-btn--ghost" href="#como-chegar">
                    Como chegar
                  </a>
                )}
              </div>
              <a
                className="ch-btn ch-btn--ghost"
                onClick={() => toggleShowChurchMembers()}
              >
                Membros ativos
              </a>
            </div>
          </div>

          {showMembers && (
            <div className="modal" onClick={toggleShowChurchMembers}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Membros ativos</h3>
                </div>

                {members.length ? (
                  <ul className="member-list">
                    {members.map((m) => (
                      <li key={m._id || m.id}>
                        {m.user?.username || m.name || "Usuário"} —{" "}
                        {m.role || "member"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum membro por enquanto.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Imagem de capa opcional */}
        {(view.about.photos || []).length > 0 && (
          <div className="ch-photos ch-photos--hero">
            {view.about.photos.map((src, i) => (
              <img key={i} src={src} alt={`foto ${i + 1}`} />
            ))}
          </div>
        )}

        {/* Contatos & Endereço */}
        <Section
          title="Informações"
          actions={
            <>
              {view.contact.instagram && (
                <a
                  href={view.contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              )}
              {view.contact.youtube && (
                <a href={view.contact.youtube} target="_blank" rel="noreferrer">
                  YouTube
                </a>
              )}
            </>
          }
        >
          <div className="ch-grid2">
            <div>
              <h3>Endereço</h3>
              <p>
                {view.address.street}
                {(view.address.city || view.address.state) && (
                  <>
                    <br />
                    {view.address.city}{" "}
                    {view.address.state && `– ${view.address.state}`}
                  </>
                )}
                {view.address.zipcode && (
                  <>
                    <br />
                    {view.address.zipcode}
                  </>
                )}
              </p>
              <div className="ch-links">
                {view.address.mapsUrl && (
                  <a
                    id="como-chegar"
                    href={view.address.mapsUrl}
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
            <div>
              <h3>Contato</h3>
              <ul className="ch-list">
                {view.contact.phone && <li>Telefone: {view.contact.phone}</li>}
                {view.contact.whatsapp && (
                  <li>WhatsApp: {view.contact.whatsapp}</li>
                )}
                {view.contact.email && <li>E-mail: {view.contact.email}</li>}
                {view.contact.website && (
                  <li>
                    Site:{" "}
                    <a
                      href={view.contact.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {view.contact.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Section>

        {/* Quem somos */}
        <Section title="Quem somos">
          <div className="ch-grid2">
            <div>
              <h4>Visão</h4>
              <p>{view.about.vision}</p>
              <h4>Missão</h4>
              <p>{view.about.mission}</p>
            </div>
            <div>
              {view.about.statementPdf ? (
                <a
                  className="ch-btn"
                  href={view.about.statementPdf}
                  target="_blank"
                  rel="noreferrer"
                >
                  Estatuto / Statement
                </a>
              ) : (
                <div className="ch-note">
                  Estatuto/statement: <em>adicionar quando disponível</em>
                </div>
              )}
              {(view.about.photos || []).length > 0 && (
                <div className="ch-photos">
                  {view.about.photos.map((src, i) => (
                    <img key={i} src={src} alt={`foto ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Horários */}
        <Section title="Horários de culto">
          {view.schedule?.length ? (
            <ul className="ch-schedule">
              {view.schedule.map((s, i) => (
                <li key={i}>
                  <strong>{s.day || "Culto"}</strong>
                  <span>{s.time}</span>
                  {s.type && <em>{s.type}</em>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="ch-note">Nenhum horário cadastrado ainda.</div>
          )}
        </Section>

        {/* Ministérios */}
        <Section title="Ministérios">
          {view.ministries?.length ? (
            <div className="ch-cards">
              {view.ministries.map((m, i) => (
                <div key={i} className="ch-card">
                  <h4>{m.name}</h4>
                  {m.desc && <p>{m.desc}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="ch-note">Nenhum ministério cadastrado ainda.</div>
          )}
        </Section>

        {/* Liderança */}
        <Section title="Liderança">
          {view.leadership?.length ? (
            <ul className="ch-list">
              {view.leadership.map((p, i) => (
                <li key={i}>
                  <strong>{p.role}:</strong> {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="ch-note">Liderança ainda não informada.</div>
          )}
        </Section>

        {/* Ofertas & Doações */}
        <Section title="Ofertas & Doações">
          {view.giving?.page ? (
            <Link className="ch-btn" to={view.giving.page}>
              Quero contribuir
            </Link>
          ) : view.giving ? (
            <ul className="ch-list">
              {view.giving.pix && <li>PIX: {view.giving.pix}</li>}
              {view.giving.bank && (
                <li>
                  Banco: {view.giving.bank.bank} · Ag. {view.giving.bank.agency}{" "}
                  · Conta {view.giving.bank.account} ({view.giving.bank.type})
                </li>
              )}
            </ul>
          ) : (
            <div className="ch-note">
              Informações de doação não disponíveis.
            </div>
          )}
        </Section>
      </div>
    </>
  );
};

export default Church;
