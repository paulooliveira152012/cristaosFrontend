// src/pages/Church.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "../styles/church.css"; // estilos simples (abaixo)
import { handleBack } from "../components/functions/headerFunctions";
import { useNavigate } from "react-router-dom";
import { fetchChurchInfo } from "./functions/churchFunctions";

const mockChurch = {
  id: "zion-santo-amaro",
  name: "Zion Church - Santo Amaro",
  // TODO: substituir por endereço confirmado
  address: {
    street: "Rua (placeholder) 123",
    district: "Santo Amaro",
    city: "São Paulo",
    state: "SP",
    zipcode: "00000-000",
    country: "Brasil",
    lat: -23.65, // TODO
    lng: -46.7, // TODO
    plusCode: "", // opcional
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-23.65,-46.70", // monta via lat/lng
  },
  // contatos
  contact: {
    phone: "(11) 0000-0000", // TODO
    whatsapp: "", // opcional
    email: "contato@zionchurch.org.br", // TODO confirmar
    website: "https://zionchurch.org.br", // TODO confirmar campus BR/pt
    instagram: "https://instagram.com/zionchurchbr", // TODO
    youtube: "https://youtube.com/@zionchurchbr", // TODO
  },
  // overview/“quem somos”
  about: {
    vision:
      "Conectar pessoas a Jesus e formar discípulos que transformam a cidade. (placeholder)",
    mission:
      "Evangelizar, discipular e servir a comunidade de Santo Amaro. (placeholder)",
    statementPdf: "", // link pro estatuto/statement se houver
    shortDescription:
      "Comunidade cristã contemporânea em Santo Amaro com cultos, pequenos grupos e ação social. (placeholder)",
    photos: [
      "/images/church/cover.jpg", // troque por imagens reais
      "/images/church/salao.jpg",
    ],
  },
  // horários de culto/eventos fixos
  schedule: [
    { day: "Domingo", time: "10:00", type: "Culto" },
    { day: "Domingo", time: "18:00", type: "Culto" },
    { day: "Quarta", time: "20:00", type: "Culto de oração" },
  ],
  // ministérios destacados
  ministries: [
    { name: "Kids", desc: "Ministério infantil durante os cultos." },
    { name: "Youth", desc: "Encontros semanais de jovens." },
    { name: "Casais", desc: "Apoio, encontros e retiros." },
    { name: "Social", desc: "Ações de serviço e doações." },
  ],
  // liderança
  leadership: [
    { role: "Pastor Principal", name: "Nome (placeholder)" },
    { role: "Pastora", name: "Nome (placeholder)" },
  ],
  // doações
  giving: {
    pix: "igreja@exemplo.com", // TODO
    bank: { bank: "Banco X", agency: "0000", account: "00000-0", type: "CC" }, // TODO
    page: "/doar", // rota interna
  },
  // SEO slug
  slug: "zion-church-santo-amaro",
};



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

const Church = () => {
  // se vier um id na URL depois você troca mockChurch por dados do backend
  const church = useMemo(() => mockChurch, []);
  const navigate = useNavigate();

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
            <h1>{church.name}</h1>
            <p>{church.about.shortDescription}</p>
            <div className="ch-hero__cta">
              {church.contact.website && (
                <a
                  className="ch-btn"
                  href={church.contact.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Site oficial
                </a>
              )}
              <a className="ch-btn ch-btn--ghost" href="#como-chegar">
                Como chegar
              </a>
            </div>
          </div>
        </div>

        {/* Contatos & Endereço */}
        <Section
          title="Informações"
          actions={
            <>
              {church.contact.instagram && (
                <a
                  href={church.contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              )}
              {church.contact.youtube && (
                <a
                  href={church.contact.youtube}
                  target="_blank"
                  rel="noreferrer"
                >
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
                {church.address.street}
                <br />
                {church.address.district} · {church.address.city} –{" "}
                {church.address.state}
                <br />
                {church.address.zipcode}
              </p>
              <div className="ch-links">
                {church.address.mapsUrl && (
                  <a
                    id="como-chegar"
                    href={church.address.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver no mapa
                  </a>
                )}
              </div>
            </div>
            <div>
              <h3>Contato</h3>
              <ul className="ch-list">
                {church.contact.phone && (
                  <li>Telefone: {church.contact.phone}</li>
                )}
                {church.contact.whatsapp && (
                  <li>WhatsApp: {church.contact.whatsapp}</li>
                )}
                {church.contact.email && (
                  <li>E-mail: {church.contact.email}</li>
                )}
                {church.contact.website && (
                  <li>
                    Site:{" "}
                    <a
                      href={church.contact.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {church.contact.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Section>

        {/* Visão / Missão / Estatuto */}
        <Section title="Quem somos">
          <div className="ch-grid2">
            <div>
              <h4>Visão</h4>
              <p>{church.about.vision}</p>
              <h4>Missão</h4>
              <p>{church.about.mission}</p>
            </div>
            <div>
              {church.about.statementPdf ? (
                <a
                  className="ch-btn"
                  href={church.about.statementPdf}
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
              <div className="ch-photos">
                {(church.about.photos || []).map((src, i) => (
                  <img key={i} src={src} alt={`foto ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Horários */}
        <Section title="Horários de culto">
          {church.schedule?.length ? (
            <ul className="ch-schedule">
              {church.schedule.map((s, i) => (
                <li key={i}>
                  <strong>{s.day}</strong>
                  <span>{s.time}</span>
                  <em>{s.type}</em>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ch-note">Nenhum horário cadastrado ainda.</div>
          )}
        </Section>

        {/* Ministérios */}
        <Section title="Ministérios">
          <div className="ch-cards">
            {church.ministries?.map((m, i) => (
              <div key={i} className="ch-card">
                <h4>{m.name}</h4>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Liderança */}
        <Section title="Liderança">
          <ul className="ch-list">
            {church.leadership?.map((p, i) => (
              <li key={i}>
                <strong>{p.role}:</strong> {p.name}
              </li>
            ))}
          </ul>
        </Section>

        {/* Doações */}
        <Section title="Ofertas & Doações">
          {church.giving?.page ? (
            <Link className="ch-btn" to={church.giving.page}>
              Quero contribuir
            </Link>
          ) : (
            <ul className="ch-list">
              {church.giving?.pix && <li>PIX: {church.giving.pix}</li>}
              {church.giving?.bank && (
                <li>
                  Banco: {church.giving.bank.bank} · Ag.{" "}
                  {church.giving.bank.agency} · Conta{" "}
                  {church.giving.bank.account} ({church.giving.bank.type})
                </li>
              )}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
};

export default Church;
