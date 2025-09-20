import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { authHeaders } from "../functions/liveRoomFunctions2";
import "../../styles/pages/suggestions.css";

/**
 * Página de Sugestões & Bugs
 * - Usuários podem enviar: Bug, Sugestão ou Outra ideia
 * - Lista todas as entradas (de todos os usuários)
 * - Se o usuário for líder, pode marcar status: pendente | em_andamento | concluido
 * - Há uma seção dedicada para itens "Em andamento" e um quadro de notas de andamento
 * - Mostra data de submissão em cada item
 *
 * OBS: Esta página usa endpoints REST genéricos. Ajuste conforme seu backend:
 *   GET    /api/suggestions                         -> lista todas
 *   POST   /api/suggestions                         -> cria nova
 *   PATCH  /api/suggestions/:id/status              -> atualiza status { status }
 *   POST   /api/suggestions/:id/vote                -> upvote
 *   GET    /api/suggestions/roadmap                 -> { notes }
 *   PUT    /api/suggestions/roadmap                 -> { notes }
 */

const baseUrl =
  process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
];

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "sugestao", label: "Sugestão" },
  { value: "ideia", label: "Outra ideia" },
];

function formatDate(d) {
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function Badge({ children, className = "" }) {
  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${className}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pendente: "border-yellow-400 text-yellow-700 bg-yellow-50",
    em_andamento: "border-blue-400 text-blue-700 bg-blue-50",
    concluido: "border-emerald-400 text-emerald-700 bg-emerald-50",
  };
  return (
    <Badge
      className={map[status] || "border-slate-300 text-slate-700 bg-slate-50"}
    >
      {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
    </Badge>
  );
}

function TypeBadge({ type }) {
  const map = {
    bug: "border-rose-400 text-rose-700 bg-rose-50",
    sugestao: "border-indigo-400 text-indigo-700 bg-indigo-50",
    ideia: "border-fuchsia-400 text-fuchsia-700 bg-fuchsia-50",
  };
  return (
    <Badge
      className={map[type] || "border-slate-300 text-slate-700 bg-slate-50"}
    >
      {TYPE_OPTIONS.find((t) => t.value === type)?.label || type}
    </Badge>
  );
}

const Suggestions = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const isLeader = !!(
    currentUser?.role === "leader" ||
    currentUser?.isLeader ||
    currentUser?.isAdmin
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filtros & busca
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDone, setShowDone] = useState(true);
  const [sort, setSort] = useState("recent");

  // novo item
  const [formType, setFormType] = useState("bug");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState("médio"); // apenas para bug
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // notas/roadmap
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  // fetch lista
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${baseUrl}/api/suggestions`, {
          credentials: "include",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Falha ao carregar sugestões");
        const data = await res.json();
        if (!cancelled)
          setItems(Array.isArray(data) ? data : data?.items || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Erro desconhecido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // fetch notas de andamento
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setNotesLoading(true);
      try {
        const res = await fetch(`${baseUrl}/api/suggestions/roadmap`, {
          credentials: "include",
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setNotes(data?.notes || "");
        }
      } catch {
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];

    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((it) =>
        [it.title, it.description, it.type, it.status, it?.author?.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(qq))
      );
    }

    if (filterType !== "all")
      list = list.filter((it) => it.type === filterType);
    if (filterStatus !== "all")
      list = list.filter((it) => it.status === filterStatus);
    if (!showDone) list = list.filter((it) => it.status !== "concluido");

    if (sort === "recent") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "popular") {
      list.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }

    return list;
  }, [items, q, filterType, filterStatus, showDone, sort]);

  const inProgress = useMemo(
    () => items.filter((it) => it.status === "em_andamento"),
    [items]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    try {
      setSubmitting(true);
      const body = {
        userId: currentUser._id,
        type: formType,
        title: title.trim(),
        description: desc.trim(),
        severity: formType === "bug" ? severity : undefined,
      };
      console.log("body de sugestao:", body);

      const res = await fetch(`${baseUrl}/api/suggestions`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      const saved = await res.json();
      setItems((prev) => [saved, ...prev]);
      setTitle("");
      setDesc("");
      setSeverity("médio");
      setFormType("bug");
      setToast("Enviado com sucesso!");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e.message || "Erro ao enviar");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      // otimista
      setItems((prev) =>
        prev.map((it) => (it._id === id ? { ...it, status: newStatus } : it))
      );
      const res = await fetch(`${baseUrl}/api/suggestions/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
    } catch (e) {
      // revert on fail (simplificado: refetch)
      try {
        const res = await fetch(`${baseUrl}/api/suggestions`, {
          credentials: "include",
          headers: authHeaders(),
        });
        if (res.ok) setItems(await res.json());
      } catch {}
    }
  }

  async function handleVote(id) {
    try {
      setItems((prev) =>
        prev.map((it) =>
          it._id === id ? { ...it, votes: (it.votes || 0) + 1 } : it
        )
      );
      await fetch(`${baseUrl}/api/suggestions/${id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
      });
    } catch {}
  }

  async function saveNotes() {
    try {
      setNotesSaving(true);
      const res = await fetch(`${baseUrl}/api/suggestions/roadmap`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      setToast("Notas atualizadas!");
      setTimeout(() => setToast(""), 2500);
    } catch {
      setToast("Falha ao salvar notas");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className="pageWrapper">
      <div className="scrollable">
        
          <Header showProfileImage={false} navigate={navigate} />

          {/* Hero / Ações rápidas */}
          <section className="mx-auto w-full max-w-6xl px-4 mt-6">
            <div className="rounded-2xl border bg-white shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">
                  Sugestões & Bugs
                </h1>
                <p className="text-slate-600 mt-1">
                  Compartilhe ideias, relate problemas e acompanhe o andamento.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFormType("bug")}
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    formType === "bug"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white hover:bg-rose-50 border-rose-300 text-rose-700"
                  }`}
                >
                  Reportar Bug
                </button>
                <button
                  onClick={() => setFormType("sugestao")}
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    formType === "sugestao"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white hover:bg-indigo-50 border-indigo-300 text-indigo-700"
                  }`}
                >
                  Nova Sugestão
                </button>
                <button
                  onClick={() => setFormType("ideia")}
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    formType === "ideia"
                      ? "bg-fuchsia-600 text-white border-fuchsia-600"
                      : "bg-white hover:bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700"
                  }`}
                >
                  Outra Ideia
                </button>
              </div>
            </div>
          </section>

          {/* Formulário */}
          <section className="mx-auto w-full max-w-6xl px-4 mt-5">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border bg-white shadow-sm p-5 md:p-6 grid gap-4"
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Título
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                    placeholder={
                      formType === "bug"
                        ? "Ex.: Erro ao enviar mensagem"
                        : "Ex.: Filtro por status"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formType === "bug" && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Severidade
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2"
                    >
                      <option>baixo</option>
                      <option>médio</option>
                      <option>alto</option>
                      <option>crítico</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                  placeholder={
                    formType === "bug"
                      ? "Passos para reproduzir, resultado esperado vs. observado…"
                      : "Descreva sua ideia e o valor para os usuários…"
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-slate-500">
                  Sua sugestão aparecerá na lista abaixo para todos.
                </div>
                <button
                  disabled={submitting || !title.trim() || !desc.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
                >
                  {submitting ? "Enviando…" : "Enviar"}
                </button>
              </div>

              {toast && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  {toast}
                </div>
              )}
            </form>
          </section>

          {/* Painel de andamento */}
          <section className="mx-auto w-full max-w-6xl px-4 mt-6 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border bg-white shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Em andamento</h2>
                <span className="text-sm text-slate-500">
                  {inProgress.length} itens
                </span>
              </div>
              {inProgress.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Nenhum item em andamento no momento.
                </div>
              ) : (
                <ul className="grid gap-3">
                  {inProgress.map((it) => (
                    <li
                      key={it._id}
                      className="border rounded-xl p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{it.title}</div>
                          <div className="text-sm text-slate-600 line-clamp-2">
                            {it.description}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <TypeBadge type={it.type} />
                          <StatusBadge status={it.status} />
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Enviado por {it?.author?.name || "Anônimo"} •{" "}
                        {formatDate(it.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border bg-white shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Quadro de notas</h3>
                {notesLoading && (
                  <span className="text-xs text-slate-500">carregando…</span>
                )}
              </div>
              {isLeader ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                    placeholder="Anote aqui bugs/implementações já em andamento, release notes curtas, etc."
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={saveNotes}
                      disabled={notesSaving}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
                    >
                      {notesSaving ? "Salvando…" : "Salvar notas"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 border rounded-xl p-3">
                    {notes || "Nenhuma nota publicada."}
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* Filtros & Lista geral */}
          <section className="mx-auto w-full max-w-6xl px-4 mt-6 mb-12 grow">
            <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-5 mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex gap-2 items-center flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por título, autor, status…"
                  className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-xl border px-3 py-2"
                >
                  <option value="all">Todos os tipos</option>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border px-3 py-2"
                >
                  <option value="all">Todos os status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showDone}
                    onChange={(e) => setShowDone(e.target.checked)}
                  />{" "}
                  Mostrar concluídos
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border px-3 py-2"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="popular">Mais populares</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border rounded-2xl bg-white p-4 shadow-sm animate-pulse h-40"
                  />
                ))
              ) : error ? (
                <div className="col-span-full text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
                  {error}
                </div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full text-slate-600 border rounded-xl bg-white p-6 text-center">
                  Nenhum item encontrado.
                </div>
              ) : (
                filtered.map((it) => (
                  <article
                    key={it._id}
                    className="border rounded-2xl bg-white p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug line-clamp-2">
                        {it.title}
                      </h3>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <TypeBadge type={it.type} />
                        <StatusBadge status={it.status} />
                        {it.severity && (
                          <Badge className="border-amber-300 text-amber-700 bg-amber-50">
                            Sev: {it.severity}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 line-clamp-3">
                      {it.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div>
                        Enviado por {it?.author?.name || "Anônimo"} •{" "}
                        {formatDate(it.createdAt)}
                      </div>
                      <button
                        onClick={() => handleVote(it._id)}
                        className="px-2 py-1 rounded-lg border text-slate-700 hover:bg-slate-50"
                      >
                        ▲ {it.votes || 0}
                      </button>
                    </div>

                    {isLeader && (
                      <div className="pt-2 border-t">
                        <label className="block text-xs mb-1 text-slate-600">
                          Status
                        </label>
                        <select
                          value={it.status}
                          onChange={(e) =>
                            handleStatusChange(it._id, e.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
  );
};

export default Suggestions;
