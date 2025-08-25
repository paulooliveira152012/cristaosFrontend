import React, { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import "../../styles/Promotions.css"

const API = process.env.REACT_APP_API_BASE_URL;

// Planos e posições (ajuste valores/descrições ao seu modelo)
const PLANS = [
  { id: "starter", label: "Starter", price: 49, reach: "até 3.000 impressões", durationDays: 7 },
  { id: "grow", label: "Grow", price: 99, reach: "até 10.000 impressões", durationDays: 14 },
  { id: "pro", label: "Pro", price: 199, reach: "até 30.000 impressões", durationDays: 30 },
];

const PLACEMENTS = [
  { id: "feed-mobile", label: "Feed (Mobile) – intercalado" },
  { id: "feed-desktop", label: "Feed (Desktop) – bloco dedicado" },
  { id: "sidebar-desktop", label: "Sidebar (Desktop)" },
  { id: "newsletter", label: "Newsletter (próxima edição)" },
  // { id: "social", label: "Cross-post em redes sociais" }, // se for oferecer
];

const CATEGORIES = [
  "Tecnologia",
  "Educação/Curso",
  "Comércio/Serviços",
  "ONG/Projeto Social",
  "Eventos",
  "Outros",
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  description: "",
  link: "",
  category: "",
  location: "",
  interests: "",
  planId: "starter",
  placements: ["feed-mobile"],
  startDate: "",
  endDate: "",
  agree: false,
};

const Promotions = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === form.planId),
    [form.planId]
  );

  // auto-preencher endDate com base no plano, se startDate mudar e usuário não definiu endDate manual
  const computedEndDate = useMemo(() => {
    if (!form.startDate || !selectedPlan) return "";
    try {
      const d = new Date(form.startDate + "T00:00:00");
      const add = selectedPlan.durationDays || 7;
      d.setDate(d.getDate() + add);
      return d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }, [form.startDate, selectedPlan]);

  const endDateToUse = form.endDate || computedEndDate;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "agree") {
      setForm((p) => ({ ...p, agree: checked }));
      return;
    }

    if (name === "placements") {
      const id = value;
      setForm((p) => {
        const has = p.placements.includes(id);
        const placements = has
          ? p.placements.filter((x) => x !== id)
          : [...p.placements, id];
        return { ...p, placements };
      });
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const onImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const validate = () => {
    const errors = [];
    if (!form.name.trim()) errors.push("Informe seu nome.");
    if (!form.email.trim()) errors.push("Informe seu e-mail.");
    if (!form.title.trim()) errors.push("Informe o título do anúncio.");
    if (!form.description.trim()) errors.push("Descreva seu anúncio.");
    if (!form.link.trim()) errors.push("Informe o link de destino.");
    if (!form.agree) errors.push("Você precisa aceitar os termos.");
    if (form.placements.length === 0) errors.push("Escolha ao menos uma posição de exibição.");
    if (!form.startDate) errors.push("Selecione a data de início.");
    // imagem opcional, mas recomendado
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const errors = validate();
    if (errors.length) {
      setMsg({ type: "error", text: errors.join(" ") });
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      Object.entries({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        title: form.title,
        description: form.description,
        link: form.link,
        category: form.category,
        location: form.location,
        interests: form.interests,
        planId: form.planId,
        placements: JSON.stringify(form.placements),
        startDate: form.startDate,
        endDate: endDateToUse,
        // reCaptchaToken: "TODO", // plugue aqui depois
      }).forEach(([k, v]) => fd.append(k, v ?? ""));

      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(`${API}/api/adManagement/submit`, {
        method: "POST",
        // credentials: "include", // se for vincular com conta logada
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar o anúncio.");

      setMsg({ type: "success", text: "Recebemos seu pedido! Entraremos em contato por e-mail." });
      // opcional: redirecionar após alguns segundos
      // setTimeout(() => navigate("/"), 2000);
      setForm(initialForm);
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header showProfileImage={false} navigate={navigate} />
    <div className="landingListingsContainer">

      <main className="promotions-container">
        <header className="promotions-hero">
          <h1>Promova seu trabalho</h1>
          <p className="subtitle">
            Anuncie sua empresa, marca, ONG ou projeto para nossa comunidade.
          </p>
        </header>

        {/* Pricing/planos rápidos */}
        <section className="plans">
          {PLANS.map((p) => (
            <label key={p.id} className={`plan ${form.planId === p.id ? "active" : ""}`}>
              <input
                type="radio"
                name="planId"
                value={p.id}
                checked={form.planId === p.id}
                onChange={onChange}
              />
              <div className="plan-body">
                <div className="plan-title">{p.label}</div>
                <div className="plan-price">R$ {p.price}</div>
                <div className="plan-reach">{p.reach}</div>
                <div className="plan-duration">Duração: {p.durationDays} dias</div>
              </div>
            </label>
          ))}
        </section>

        {/* Form principal */}
        <form className="promo-form" onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Seu nome*</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="Nome completo" />
            </div>
            <div className="field">
              <label>E-mail*</label>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="voce@exemplo.com" />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Telefone (opcional)</label>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="DDD + número" />
            </div>
            <div className="field">
              <label>Empresa/Marca (opcional)</label>
              <input name="company" value={form.company} onChange={onChange} placeholder="Nome da empresa" />
            </div>
          </div>

          <div className="field">
            <label>Título do anúncio*</label>
            <input name="title" value={form.title} onChange={onChange} placeholder="Ex.: Soluções digitais empresariais" />
          </div>

          <div className="field">
            <label>Descrição*</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Texto do seu anúncio..."
              rows={4}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Link de destino*</label>
              <input name="link" value={form.link} onChange={onChange} placeholder="https://..." />
            </div>
            <div className="field">
              <label>Categoria</label>
              <select name="category" value={form.category} onChange={onChange}>
                <option value="">Selecione</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Localização (segmentação)</label>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="Ex.: São Paulo, Brasil / NJ, EUA"
              />
            </div>
            <div className="field">
              <label>Interesses (segmentação)</label>
              <input
                name="interests"
                value={form.interests}
                onChange={onChange}
                placeholder="Ex.: tecnologia, confeitaria, finanças"
              />
            </div>
          </div>

          <div className="field">
            <label>Posições de exibição</label>
            <div className="chips">
              {PLACEMENTS.map((pl) => (
                <label key={pl.id} className={`chip ${form.placements.includes(pl.id) ? "chip-active" : ""}`}>
                  <input
                    type="checkbox"
                    name="placements"
                    value={pl.id}
                    checked={form.placements.includes(pl.id)}
                    onChange={onChange}
                  />
                  {pl.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Início*</label>
              <input type="date" name="startDate" value={form.startDate} onChange={onChange} />
            </div>
            <div className="field">
              <label>Fim</label>
              <input
                type="date"
                name="endDate"
                value={endDateToUse}
                onChange={onChange}
                // dica pro usuário: fim auto pelo plano se ele não definir
                title="Se não definir, usamos automaticamente a duração do plano."
              />
            </div>
          </div>

          <div className="field">
            <label>Imagem (recomendado, 1200x628)</label>
            <input type="file" accept="image/*" onChange={onImagePick} />
            {imagePreview && (
              <div className="img-preview">
                <img src={imagePreview} alt="preview" />
              </div>
            )}
          </div>

          {/* Placeholder reCAPTCHA (integre depois) */}
          <div className="recaptcha-box">
            <small>reCAPTCHA placeholder</small>
          </div>

          <label className="agree">
            <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
            Confirmo que li e aceito os termos de anúncio e políticas de conteúdo.
          </label>

          {/* Preview do anúncio no estilo do feed */}
          <section className="ad-preview">
            <div className="adContainer">
              <a href={form.link || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="listing-content">
                  <div className="heading">
                    <h2 style={{ marginBottom: 8 }}>{form.title || "Título do anúncio"}</h2>
                    {form.description && <p style={{ textAlign: "justify" }}>{form.description}</p>}
                  </div>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Ad"
                      className="listingImage"
                      style={{ width: "100%", height: "auto" }}
                    />
                  )}
                </div>
              </a>
              <div className="sponsored-tag">Patrocinado</div>
            </div>
          </section>

          {msg.text && (
            <div className={`form-msg ${msg.type === "error" ? "error" : "success"}`}>
              {msg.text}
            </div>
          )}

          <div className="cta">
            <button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : `Enviar proposta (${selectedPlan?.label} · R$ ${selectedPlan?.price})`}
            </button>
            <p className="hint">
              Após o envio, nossa equipe validará o material e retornará com confirmação e instruções de pagamento.
            </p>
          </div>
        </form>
      </main>
    </div>
    </>
  );
};

export default Promotions;
