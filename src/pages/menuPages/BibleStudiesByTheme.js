import React, { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

// ====== Dados ======
const THEMES = [
  {
    id: "graca-justificacao",
    title: "Graça e Justificação",
    desc: "A salvação é dom imerecido de Deus, recebido pela fé em Cristo.",
    outline: ["Problema do pecado", "Graça imerecida", "Fé salvadora", "Vida nova", "Segurança em Cristo"],
    study: {
      summary:
        "Deus declara justo o pecador que crê em Cristo, não por obras, mas pela graça. A justiça de Cristo é imputada ao crente.",
      keyVerses: ["Ef 2:8–9", "Rm 3:21–26", "Rm 5:1"],
      bigIdeas: [
        "Justificação é forense: Deus nos declara justos em Cristo.",
        "Fé é o meio; Cristo é o fundamento.",
        "Graça conduz a gratidão e santidade, não ao libertinismo."
      ],
      application: [
        "Descansar na obra completa de Cristo.",
        "Combater a culpa crônica com a verdade do evangelho.",
        "Viver gratidão prática (adoração e serviço)."
      ],
      questions: [
        "Como diferenciar graça de permissividade?",
        "Que sinais acompanham quem entendeu a justificação?",
        "O que muda no meu dia a dia por ser aceito em Cristo?"
      ]
    }
  },
  {
    id: "santificacao",
    title: "Santificação Prática",
    desc: "Crescer em Cristo pelo Espírito, longe do legalismo.",
    outline: ["Identidade em Cristo", "Meios de graça", "Vencer pecados", "Disciplina espiritual", "Vida no Espírito"],
    study: {
      summary:
        "Santificação é processo de ser conformado à imagem de Cristo, operado pelo Espírito, por meio de meios de graça e obediência.",
      keyVerses: ["1Ts 4:3", "Hb 12:14", "Gl 5:16–25"],
      bigIdeas: [
        "Posicional (em Cristo) e progressiva (na prática).",
        "Meios de graça: Palavra, oração, comunhão, sacramentos.",
        "Fruto do Espírito é o alvo, não performance vazia."
      ],
      application: [
        "Planejar disciplinas espirituais realistas.",
        "Confessar pecados e buscar ajuda.",
        "Buscar transformação do coração, não só comportamento."
      ],
      questions: [
        "Quais hábitos me aproximam de Cristo hoje?",
        "Estou lutando sozinho ou em comunidade?",
        "Como medir progresso sem cair em legalismo?"
      ]
    }
  },
  {
    id: "espirito-santo",
    title: "O Espírito Santo",
    desc: "Pessoa divina que habita, guia e capacita a Igreja.",
    outline: ["Quem Ele é", "Habitação e selo", "Fruto vs dons", "Discernimento", "Edificação da Igreja"],
    study: {
      summary:
        "O Espírito é Deus, aplica a salvação, habita no crente, distribui dons e produz fruto para edificação do corpo.",
      keyVerses: ["Jo 14–16", "At 1:8", "1Co 12–14", "Gl 5:22–23"],
      bigIdeas: [
        "Dons servem ao corpo; fruto revela maturidade.",
        "Ele glorifica Cristo e conduz à verdade.",
        "Discernimento é vital para julgar práticas e ensinos."
      ],
      application: [
        "Orar pedindo enchimento e direção.",
        "Usar dons com amor e ordem.",
        "Buscar fruto visível no caráter."
      ],
      questions: [
        "Quais dons Deus me deu para servir?",
        "Meu uso de dons edifica em amor?",
        "Como pratico discernimento bíblico?"
      ]
    }
  },
  {
    id: "oracao",
    title: "Vida de Oração",
    desc: "Relacionamento com Deus: adoração, petição, confissão e ação de graças.",
    outline: ["Pai Nosso", "Pedir/Buscar/Bater", "Jejum", "Perseverança", "Oração e missão"],
    study: {
      summary:
        "Orar é falar com o Pai em nome do Filho, no poder do Espírito. A oração molda nosso coração e alinha nossa vontade à de Deus.",
      keyVerses: ["Mt 6:9–13", "Fp 4:6–7", "1Ts 5:17"],
      bigIdeas: [
        "Padrões bíblicos (Pai Nosso) educam o coração.",
        "Perseverança e confiança na soberania de Deus.",
        "Jejum: intensifica a dependência e foco."
      ],
      application: [
        "Estabelecer ritmos diários curtos e constantes.",
        "Combinar oração com Palavra e jejum em decisões.",
        "Orar em comunidade e pelos perdidos."
      ],
      questions: [
        "Quais obstáculos pessoais travam minha oração?",
        "Como praticar oração sem cessar no cotidiano?",
        "Por quem Deus está me chamando a interceder?"
      ]
    }
  },
  {
    id: "fe-e-obras",
    title: "Fé e Obras",
    desc: "A fé genuína produz obras visíveis de amor e justiça.",
    outline: ["Fé viva", "Obediência", "Misericórdia", "Trabalho e honestidade", "Testemunho público"],
    study: {
      summary:
        "Não somos salvos por obras, mas a fé salvadora inevitavelmente frutifica em boas obras preparadas por Deus.",
      keyVerses: ["Tg 2:14–26", "Ef 2:8–10", "Mt 5:16"],
      bigIdeas: [
        "Fé e obras não competem; se complementam.",
        "Obras dão testemunho da realidade da fé.",
        "Vocações se tornam serviço ao próximo."
      ],
      application: [
        "Praticar misericórdia concreta.",
        "Excelência e honestidade no trabalho.",
        "Integridade pública que aponta para Cristo."
      ],
      questions: [
        "Minhas obras refletem minha fé?",
        "Onde posso servir com meus dons?",
        "Meu trabalho exibe o caráter de Cristo?"
      ]
    }
  },
  {
    id: "igreja-comunhao",
    title: "Igreja e Comunhão",
    desc: "Corpo de Cristo chamado à unidade, serviço e disciplina amorosa.",
    outline: ["Corpo de Cristo", "Ceia e batismo", "Serviço mútuo", "Disciplina e cuidado", "Unidade essencial"],
    study: {
      summary:
        "A Igreja é comunidade redimida, unida em Cristo, nutrida pela Palavra e sacramentos, que vive amor, serviço e disciplina.",
      keyVerses: ["At 2:42–47", "1Co 12", "Ef 4:1–16"],
      bigIdeas: [
        "Unidade na essência, caridade nas secundárias.",
        "Dons diferentes, um só corpo e missão.",
        "Disciplina é cuidado para restauração."
      ],
      application: [
        "Compromisso com uma comunidade local.",
        "Servir com constância e alegria.",
        "Promover reconciliação e paz."
      ],
      questions: [
        "Como posso fortalecer a unidade?",
        "Quais necessidades posso suprir hoje?",
        "Tenho recebido e oferecido cuidado mútuo?"
      ]
    }
  },
  {
    id: "missao-evangelismo",
    title: "Missão e Evangelismo",
    desc: "Participação da Igreja na proclamação do evangelho ao mundo.",
    outline: ["Grande Comissão", "Estilo de vida missionário", "Apologética básica", "Compaixão e justiça", "Orar por povos"],
    study: {
      summary:
        "A missão flui do coração de Deus: proclamar Cristo, discipular e abençoar povos, unindo palavra e ação.",
      keyVerses: ["Mt 28:18–20", "At 1:8", "Rm 10:14–15"],
      bigIdeas: [
        "Todos são enviados onde estão.",
        "Evangelho claro com vida coerente.",
        "Igreja ora, sustenta e envia."
      ],
      application: [
        "Compartilhar fé com clareza e mansidão.",
        "Praticar compaixão e justiça.",
        "Orar e apoiar missões locais e globais."
      ],
      questions: [
        "Quem são meus ‘alvos de oração’?",
        "Como unir palavra e obras?",
        "Qual meu próximo passo missionário?"
      ]
    }
  },
  {
    id: "familia-casamento",
    title: "Família e Casamento",
    desc: "Aliança de amor que reflete Cristo e a Igreja.",
    outline: ["Aliança e amor", "Papel de marido e esposa", "Educação dos filhos", "Pureza e perdão", "Conflitos e reconciliação"],
    study: {
      summary:
        "O casamento espelha Cristo e a Igreja. Família é lugar de discipulado, serviço e perdão contínuo.",
      keyVerses: ["Ef 5:22–33", "Cl 3:18–21", "Sl 127"],
      bigIdeas: [
        "Papéis complementares e dignidade igual.",
        "Educar na fé com amor e verdade.",
        "Perdão sustenta o convívio pecador."
      ],
      application: [
        "Culto doméstico simples e fiel.",
        "Comunicação honesta e graciosa.",
        "Fidelidade e proteção da pureza."
      ],
      questions: [
        "Como nosso lar aponta para Cristo?",
        "Onde precisamos de restauração?",
        "Quais hábitos fortalecerão nossa família?"
      ]
    }
  },
  {
    id: "mordomia-financas",
    title: "Mordomia e Finanças",
    desc: "Gerir recursos como servos do Dono de tudo.",
    outline: ["Provisão e contentamento", "Generosidade", "Trabalho diligente", "Dízimo/Oferta", "Planejamento e honestidade"],
    study: {
      summary:
        "Deus é dono de tudo; administramos para a glória dele. Generosidade, contentamento e honestidade são marcas do Reino.",
      keyVerses: ["1Tm 6:6–10", "2Co 9:6–11", "Pv 3:9–10"],
      bigIdeas: [
        "Riqueza é meio, não fim.",
        "Generosidade alegre como resposta à graça.",
        "Planejamento sábio e ética no trabalho."
      ],
      application: [
        "Orçar, poupar e doar com propósito.",
        "Evitar dívidas imprudentes.",
        "Atos de generosidade regulares."
      ],
      questions: [
        "Minhas finanças servem a que propósito?",
        "Onde posso crescer em generosidade?",
        "Que ajustes práticos farei este mês?"
      ]
    }
  },
  {
    id: "sofrimento-esperanca",
    title: "Sofrimento e Esperança",
    desc: "A dor sob a soberania de Deus e a esperança futura.",
    outline: ["Causas do sofrimento", "Consolo de Deus", "Comunidade que ampara", "Propósito na dor", "Esperança escatológica"],
    study: {
      summary:
        "Sofremos num mundo caído, mas Deus consola e usa a dor para nos conformar a Cristo. A esperança final sustenta a fé.",
      keyVerses: ["Rm 8:18–28", "2Co 1:3–7", "Ap 21:3–5"],
      bigIdeas: [
        "Deus está presente e governa.",
        "Consolo recebido para consolar outros.",
        "Glória futura supera a dor presente."
      ],
      application: [
        "Lamentar bíblicamente e perseverar em oração.",
        "Buscar apoio da igreja.",
        "Servir outros com empatia."
      ],
      questions: [
        "Como trago meus sofrimentos a Deus?",
        "Quem posso consolar hoje?",
        "Quais promessas alimentam minha esperança?"
      ]
    }
  }
];

// ====== UI ======
const ThemeCard = ({ theme, query = "" }) => {
  const [open, setOpen] = useState(false);

  const mark = (text) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
    );
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 6px" }}>{mark(theme.title)}</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.9 }}>{mark(theme.desc)}</p>
        </div>
        <button style={styles.toggle} onClick={() => setOpen((v) => !v)} aria-label="Expandir estudo">
          {open ? "–" : "+"}
        </button>
      </div>

      <ul style={{ margin: "6px 0 8px 18px" }}>
        {theme.outline.map((o, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{mark(o)}</li>
        ))}
      </ul>

      {open && (
        <div style={styles.studyBox}>
          <p style={{ margin: "0 0 8px" }}><strong>Resumo:</strong> {theme.study.summary}</p>

          <div style={styles.row}>
            <div style={styles.col}>
              <strong>Versos-chave</strong>
              <ul style={styles.ul}>
                {theme.study.keyVerses.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div style={styles.col}>
              <strong>Ideias centrais</strong>
              <ul style={styles.ul}>
                {theme.study.bigIdeas.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <strong>Aplicações</strong>
              <ul style={styles.ul}>
                {theme.study.application.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div style={styles.col}>
              <strong>Perguntas para refletir</strong>
              <ul style={styles.ul}>
                {theme.study.questions.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====== Página ======
const BibleStudiesByTheme = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return THEMES;
    const s = q.trim().toLowerCase();
    return THEMES.filter((t) => {
      const hay = [
        t.title,
        t.desc,
        ...(t.outline || []),
        t.study?.summary || "",
        ...(t.study?.keyVerses || []),
        ...(t.study?.bigIdeas || []),
        ...(t.study?.application || []),
        ...(t.study?.questions || [])
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [q]);

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div style={styles.container}>
        <h1 style={{ margin: "8px 0 4px" }}>Estudos por Temas</h1>
        <p style={{ margin: "0 0 12px", opacity: 0.9 }}>
          Explore estudos bíblicos organizados por temas centrais da fé cristã.
        </p>

        <div style={styles.toolbar}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por tema, tópico, verso..."
            style={styles.input}
          />
          {q && (
            <button style={styles.clearBtn} onClick={() => setQ("")} aria-label="Limpar busca">
              Limpar
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ opacity: 0.8, fontStyle: "italic" }}>
            Nenhum resultado para <strong>{q}</strong>. Tente outros termos.
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((t) => (
              <ThemeCard key={t.id} theme={t} query={q} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// ====== Helpers & estilos ======
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const styles = {
  container: { maxWidth: 1000, margin: "0 auto", padding: 16 },
  toolbar: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  input: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, minWidth: 260, flex: "0 0 auto" },
  clearBtn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e2e2", background: "#fff", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
  card: { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" },
  toggle: { borderRadius: 10, border: "1px solid #ddd", height: 36, width: 36, cursor: "pointer" },
  studyBox: { borderTop: "1px dashed #e5e7eb", paddingTop: 10, marginTop: 8 },
  row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 8 },
  col: { background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 10 },
  ul: { margin: "6px 0 0 18px" }
};

export default BibleStudiesByTheme;
