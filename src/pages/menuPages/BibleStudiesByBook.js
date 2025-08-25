import React, { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

/**
 * Dados dos 66 livros — descrição curtinha + 5 pontos essenciais.
 * Mantive bullets bem concisos para caber em cards.
 * Se preferir, posso alongar depois.
 */
const BOOKS = [
  // ======== ANTIGO TESTAMENTO ========
  // Pentateuco
  {
    id: "genesis",
    name: "Gênesis",
    testament: "AT",
    desc: "Começos: criação, queda, patriarcas e promessa.",
    points: [
      "Autor (trad.): Moisés",
      "Tema: criação/aliança",
      "Patriarcas: Abraão, Isaque, Jacó",
      "Gn 3:15: promessa messiânica",
      "Gn 12:3: bênção às nações",
    ],
  },
  {
    id: "exodo",
    name: "Êxodo",
    testament: "AT",
    desc: "Libertação do Egito, aliança no Sinai, tabernáculo.",
    points: [
      "Autor (trad.): Moisés",
      "Tema: redenção/lei",
      "Páscoa e Êxodo",
      "Dez Mandamentos",
      "Presença: tabernáculo",
    ],
  },
  {
    id: "levitico",
    name: "Levítico",
    testament: "AT",
    desc: "Santuário, sacrifícios e santidade do povo.",
    points: [
      "Autor (trad.): Moisés",
      "Tema: santidade",
      "Sistema sacrificial",
      "Sacerdócio levítico",
      "Lv 11:45: santos, porque Deus é santo",
    ],
  },
  {
    id: "numeros",
    name: "Números",
    testament: "AT",
    desc: "Peregrinação, censos e disciplina no deserto.",
    points: [
      "Autor (trad.): Moisés",
      "Tema: peregrinação",
      "Murmuração e juízo",
      "Bronze serpente (Nm 21)",
      "Fidelidade divina",
    ],
  },
  {
    id: "deuteronomio",
    name: "Deuteronômio",
    testament: "AT",
    desc: "Renovação da aliança e apelos à obediência.",
    points: [
      "Autor (trad.): Moisés",
      "Tema: aliança/obediência",
      "Shema (Dt 6:4-5)",
      "Bênçãos e maldições",
      "Profeta como Moisés (Dt 18)",
    ],
  },
  // Históricos
  {
    id: "josue",
    name: "Josué",
    testament: "AT",
    desc: "Conquista e posse da Terra Prometida.",
    points: [
      "Líder: Josué",
      "Tema: conquista",
      "Jericó e Ai",
      "Distribuição da terra",
      "Js 24:15: “eu e minha casa…”",
    ],
  },
  {
    id: "juizes",
    name: "Juízes",
    testament: "AT",
    desc: "Ciclo de queda, opressão, clamor e livramento.",
    points: [
      "Lideranças temporárias",
      "Tema: ciclos",
      "Débora, Gideão, Sansão",
      "Jz 17:6: “cada um fazia…”",
      "Necessidade de rei",
    ],
  },
  {
    id: "rute",
    name: "Rute",
    testament: "AT",
    desc: "Lealdade e redenção; linhagem de Davi.",
    points: [
      "Lealdade de Rute",
      "Boaz: resgatador",
      "Tema: providência",
      "Genealogia messiânica",
      "De Moabe a Belém",
    ],
  },
  {
    id: "1samuel",
    name: "1 Samuel",
    testament: "AT",
    desc: "Samuel, Saul e a ascensão de Davi.",
    points: [
      "Transição a monarquia",
      "Saul: rejeição",
      "Davi ungido",
      "Tema: obediência > sacrifícios",
      "1Sm 16:7: coração",
    ],
  },
  {
    id: "2samuel",
    name: "2 Samuel",
    testament: "AT",
    desc: "Reinado de Davi: vitórias, queda e promessa.",
    points: [
      "Aliança davídica (2Sm 7)",
      "Betsabá e arrependimento",
      "Conflitos familiares",
      "Tema: misericórdia",
      "Messias filho de Davi",
    ],
  },
  {
    id: "1reis",
    name: "1 Reis",
    testament: "AT",
    desc: "Salomão, divisão do reino e profetas.",
    points: [
      "Templo de Salomão",
      "Sabedoria e queda",
      "Reino dividido",
      "Elias",
      "Fidelidade vs idolatria",
    ],
  },
  {
    id: "2reis",
    name: "2 Reis",
    testament: "AT",
    desc: "Queda de Israel e Judá; exílio.",
    points: [
      "Eliseu",
      "Queda do Norte (722 a.C.)",
      "Queda de Judá (586 a.C.)",
      "Tema: juízo",
      "Esperança futura",
    ],
  },
  {
    id: "1cronicas",
    name: "1 Crônicas",
    testament: "AT",
    desc: "Genealogias e reinado de Davi sob nova lente.",
    points: [
      "Ênfase no culto",
      "Arca e levitas",
      "Promessa a Davi",
      "Foco em Judá",
      "Memória teológica",
    ],
  },
  {
    id: "2cronicas",
    name: "2 Crônicas",
    testament: "AT",
    desc: "Reis de Judá até o exílio; chamado ao arrependimento.",
    points: [
      "Templo e reforma",
      "Ezequias/Josias",
      "Infidelidade recorrente",
      "Exílio babilônico",
      "2Cr 7:14",
    ],
  },
  {
    id: "esdras",
    name: "Esdras",
    testament: "AT",
    desc: "Retorno do exílio e restauração espiritual.",
    points: [
      "Ciro e retorno",
      "Reedificação do templo",
      "Esdras: escriba",
      "Pureza e lei",
      "Tema: restauração",
    ],
  },
  {
    id: "neemias",
    name: "Neemias",
    testament: "AT",
    desc: "Muros de Jerusalém e renovação do povo.",
    points: [
      "Reconstrução dos muros",
      "Oposição externa",
      "Reformas sociais",
      "Leitura da lei",
      "Oração e liderança",
    ],
  },
  {
    id: "ester",
    name: "Ester",
    testament: "AT",
    desc: "Providência oculta preserva o povo.",
    points: [
      "Rainha Ester",
      "Hamã vs Mordecai",
      "Purim",
      "Deus nos bastidores",
      "Libertação sem milagres visíveis",
    ],
  },
  // Poéticos e Sapienciais
  {
    id: "jo",
    name: "Jó",
    testament: "AT",
    desc: "Sofrimento do justo e soberania divina.",
    points: [
      "Inocência/sofrimento",
      "Amigos e teodiceia",
      "Deus responde",
      "Humildade humana",
      "Restauração",
    ],
  },
  {
    id: "salmos",
    name: "Salmos",
    testament: "AT",
    desc: "Hinário de oração, lamento e louvor.",
    points: [
      "Davi e outros",
      "Lamentos e louvores",
      "Messiânicos",
      "Vida devocional",
      "Sl 23; 51; 119",
    ],
  },
  {
    id: "proverbios",
    name: "Provérbios",
    testament: "AT",
    desc: "Sabedoria prática para o viver piedoso.",
    points: [
      "Temor do Senhor",
      "Vida diária",
      "Palavras e trabalho",
      "Pureza e prudência",
      "Pv 1:7; 3:5-6",
    ],
  },
  {
    id: "eclesiastes",
    name: "Eclesiastes",
    testament: "AT",
    desc: "Vaidade de tudo sem Deus; tema do temor.",
    points: [
      "“Vaidade das vaidades”",
      "Limites da sabedoria",
      "Ciclos da vida",
      "Alegria em Deus",
      "Ec 12:13-14",
    ],
  },
  {
    id: "canticos",
    name: "Cântico dos Cânticos",
    testament: "AT",
    desc: "Amor poético; beleza do casamento.",
    points: [
      "Amor conjugal",
      "Poesia e metáforas",
      "Pureza e desejo",
      "Leituras alegóricas",
      "Dádiva de Deus",
    ],
  },
  // Profetas Maiores
  {
    id: "isaias",
    name: "Isaías",
    testament: "AT",
    desc: "Santo de Israel: juízo e esperança messiânica.",
    points: [
      "Chamado (Is 6)",
      "Servo sofredor (Is 53)",
      "Emanuel",
      "Restauração",
      "Deus soberano",
    ],
  },
  {
    id: "jeremias",
    name: "Jeremias",
    testament: "AT",
    desc: "Profeta chorão: nova aliança e juízo.",
    points: [
      "Chamado jovem",
      "Nova aliança (Jr 31)",
      "Queda de Jerusalém",
      "Lutas pessoais",
      "Fidelidade em oposição",
    ],
  },
  {
    id: "lamentacoes",
    name: "Lamentações",
    testament: "AT",
    desc: "Poemas de luto pela queda de Jerusalém.",
    points: [
      "Dor e memória",
      "Justiça divina",
      "Esperança no Senhor",
      "Lm 3:22-23",
      "Clamor por restauração",
    ],
  },
  {
    id: "ezequiel",
    name: "Ezequiel",
    testament: "AT",
    desc: "Visões, juízo e futura restauração.",
    points: [
      "Glória do Senhor",
      "Coração novo (Ez 36)",
      "Vale de ossos secos",
      "Novo templo",
      "Responsabilidade pessoal",
    ],
  },
  {
    id: "daniel",
    name: "Daniel",
    testament: "AT",
    desc: "Fidelidade no exílio e reinos de Deus.",
    points: [
      "Forno e cova",
      "Sonhos/visões",
      "Reino eterno",
      "Soberania divina",
      "Vida piedosa no império",
    ],
  },
  // Profetas Menores
  {
    id: "oseias",
    name: "Oséias",
    testament: "AT",
    desc: "Amor fiel de Deus a um povo infiel.",
    points: [
      "Casamento-sinal",
      "Tema: misericórdia",
      "Conhecer a Deus",
      "Arrependimento",
      "Os 6:6",
    ],
  },
  {
    id: "joel",
    name: "Joel",
    testament: "AT",
    desc: "Dia do Senhor e derramamento do Espírito.",
    points: [
      "Praga de gafanhotos",
      "Convite ao jejum",
      "Jl 2:28-32",
      "Juízo e salvação",
      "Restauração",
    ],
  },
  {
    id: "amos",
    name: "Amós",
    testament: "AT",
    desc: "Justiça social e culto verdadeiro.",
    points: [
      "Contra opressão",
      "Direito e justiça",
      "Culto sem vida = erro",
      "Juízo iminente",
      "Esperança final",
    ],
  },
  {
    id: "obadias",
    name: "Obadias",
    testament: "AT",
    desc: "Oráculo contra Edom; soberania de Deus.",
    points: [
      "Orgulho de Edom",
      "Colheita do que semeia",
      "Dia do Senhor",
      "Sião exaltada",
      "Livro mais curto AT",
    ],
  },
  {
    id: "jonas",
    name: "Jonas",
    testament: "AT",
    desc: "Profeta relutante; misericórdia para Nínive.",
    points: [
      "Fuga do chamado",
      "Peixe grande",
      "Arrependimento gentio",
      "Compaixão divina",
      "Crítica ao exclusivismo",
    ],
  },
  {
    id: "miqueias",
    name: "Miqueias",
    testament: "AT",
    desc: "Juízo e esperança; Messias de Belém.",
    points: [
      "Mq 5:2",
      "Justiça, misericórdia, humildade",
      "Condena líderes corruptos",
      "Restauração",
      "Verdadeiro culto",
    ],
  },
  {
    id: "naum",
    name: "Naum",
    testament: "AT",
    desc: "Queda de Nínive; justiça de Deus.",
    points: [
      "Consolo a Judá",
      "Juízo a opressores",
      "Deus zeloso",
      "Fim de impérios",
      "Tema: retribuição",
    ],
  },
  {
    id: "habacuque",
    name: "Habacuque",
    testament: "AT",
    desc: "Do protesto à fé: o justo viverá pela fé.",
    points: [
      "Por quê, Senhor?",
      "Deus responde",
      "Hc 2:4",
      "Salmo de confiança",
      "Soberania mesmo no caos",
    ],
  },
  {
    id: "sofonias",
    name: "Sofonias",
    testament: "AT",
    desc: "Dia do Senhor: juízo e restauração.",
    points: [
      "Contra Judá e nações",
      "Convite ao arrependimento",
      "Restauração futura",
      "Sf 3:17",
      "Humildes preservados",
    ],
  },
  {
    id: "ageu",
    name: "Ageu",
    testament: "AT",
    desc: "Prioridade ao templo; presença de Deus.",
    points: [
      "Chamado à obra",
      "Bênção ao obedecer",
      "Glória futura",
      "Zorobabel",
      "Tema: prioridades",
    ],
  },
  {
    id: "zacarias",
    name: "Zacarias",
    testament: "AT",
    desc: "Visões de restauração e Messias humilde.",
    points: [
      "Visões simbólicas",
      "Sacerdote e rei",
      "Entrada humilde (Zc 9:9)",
      "Purificação",
      "Futuro messiânico",
    ],
  },
  {
    id: "malaquias",
    name: "Malaquias",
    testament: "AT",
    desc: "Chamado à fidelidade; promessa do mensageiro.",
    points: [
      "Culto negligente",
      "Matrimônio e dízimos",
      "Mensageiro (João?)",
      "Temer ao Senhor",
      "Ponte p/ NT",
    ],
  },

  // ======== NOVO TESTAMENTO ========
  // Evangelhos e Atos
  {
    id: "mateus",
    name: "Mateus",
    testament: "NT",
    desc: "Jesus, Rei messiânico; cumprimento do AT.",
    points: [
      "Genealogia davídica",
      "Sermão do Monte",
      "Parábolas do Reino",
      "Grande Comissão",
      "Cumprimentos proféticos",
    ],
  },
  {
    id: "marcos",
    name: "Marcos",
    testament: "NT",
    desc: "Evangelho dinâmico: ações de Jesus.",
    points: [
      "Ênfase em milagres",
      "Serviço e sofrimento",
      "Confissão de Pedro",
      "Cruz e ressurreição",
      "Mc 10:45",
    ],
  },
  {
    id: "lucas",
    name: "Lucas",
    testament: "NT",
    desc: "História ordenada; compaixão por marginalizados.",
    points: [
      "Narrativa detalhada",
      "Ênfase nos pobres",
      "Oração e Espírito",
      "Parábola do Filho Pródigo",
      "Universalidade do evangelho",
    ],
  },
  {
    id: "joao",
    name: "João",
    testament: "NT",
    desc: "Verbo encarnado; sinais e “Eu sou”.",
    points: [
      "Prólogo (Jo 1)",
      "7 sinais",
      "Eu sou…",
      "Amor e verdade",
      "Jo 20:31",
    ],
  },
  {
    id: "atos",
    name: "Atos",
    testament: "NT",
    desc: "Espírito Santo, missão e expansão da Igreja.",
    points: [
      "Pentecostes",
      "Pedro e Paulo",
      "Jerusalém → Roma",
      "Comunidade e perseguição",
      "Evangelho às nações",
    ],
  },
  // Cartas de Paulo
  {
    id: "romanos",
    name: "Romanos",
    testament: "NT",
    desc: "Justificação pela fé e vida no Espírito.",
    points: [
      "Pecado universal",
      "Graça mediante fé",
      "Vida no Espírito",
      "Israel e planos de Deus",
      "Vida prática (Rm 12–15)",
    ],
  },
  {
    id: "1corintios",
    name: "1 Coríntios",
    testament: "NT",
    desc: "Igreja e santidade; dons e amor.",
    points: [
      "Unidade",
      "Pureza moral",
      "Ceia do Senhor",
      "Dons espirituais",
      "1Co 13: amor",
    ],
  },
  {
    id: "2corintios",
    name: "2 Coríntios",
    testament: "NT",
    desc: "Ministério fraco, mas poderoso em Cristo.",
    points: [
      "Consolo e aflições",
      "Nova aliança",
      "Generosidade",
      "Autoridade apostólica",
      "Poder na fraqueza",
    ],
  },
  {
    id: "galatas",
    name: "Gálatas",
    testament: "NT",
    desc: "Liberdade no evangelho vs legalismo.",
    points: [
      "Graça x lei",
      "Justificação pela fé",
      "Filhos da promessa",
      "Fruto do Espírito",
      "Liberdade cristã",
    ],
  },
  {
    id: "efesios",
    name: "Efésios",
    testament: "NT",
    desc: "Igreja em Cristo e vida nova.",
    points: [
      "Unidos em Cristo",
      "Reconciliação",
      "Vida prática",
      "Família e batalha espiritual",
      "Ef 2:8-10",
    ],
  },
  {
    id: "filipenses",
    name: "Filipenses",
    testament: "NT",
    desc: "Alegria no Senhor e humildade de Cristo.",
    points: [
      "Parceria no evangelho",
      "Cristo se humilhou (Fp 2)",
      "Alegria em toda circunstância",
      "Exemplo de Paulo",
      "Fp 4:4-7",
    ],
  },
  {
    id: "colossenses",
    name: "Colossenses",
    testament: "NT",
    desc: "Supremacia de Cristo sobre tudo.",
    points: [
      "Cristo: imagem de Deus",
      "Plenitude nele",
      "Contra falsos ensinos",
      "Vida ressuscitada",
      "Cl 1:15-20",
    ],
  },
  {
    id: "1tessalonicenses",
    name: "1 Tessalonicenses",
    testament: "NT",
    desc: "Consolo e santidade; esperança na volta.",
    points: [
      "Modelo de fé",
      "Pureza e amor fraternal",
      "Trabalho e vigilância",
      "Parusia e consolo",
      "1Ts 4:13-18",
    ],
  },
  {
    id: "2tessalonicenses",
    name: "2 Tessalonicenses",
    testament: "NT",
    desc: "Correções sobre o Dia do Senhor.",
    points: [
      "Perseverança",
      "Homem da iniquidade",
      "Não se abalar facilmente",
      "Disciplina aos ociosos",
      "Consolo escatológico",
    ],
  },
  {
    id: "1timoteo",
    name: "1 Timóteo",
    testament: "NT",
    desc: "Ordem na igreja e vida do ministro.",
    points: [
      "Sã doutrina",
      "Liderança/diáconos",
      "Piedade prática",
      "Combater falsos ensinos",
      "Exemplo do pastor",
    ],
  },
  {
    id: "2timoteo",
    name: "2 Timóteo",
    testament: "NT",
    desc: "Últimas palavras de Paulo; fidelidade final.",
    points: [
      "Sofrer pelo evangelho",
      "Escritura inspirada (2Tm 3:16)",
      "Fidelidade até o fim",
      "Discípulos fiéis",
      "Coroa reservada",
    ],
  },
  {
    id: "tito",
    name: "Tito",
    testament: "NT",
    desc: "Boa ordem na igreja e boas obras.",
    points: [
      "Líderes piedosos",
      "Sã doutrina",
      "Graça educadora",
      "Boas obras",
      "Vida pública exemplar",
    ],
  },
  {
    id: "filemom",
    name: "Filemom",
    testament: "NT",
    desc: "Perdão e reconciliação em Cristo.",
    points: [
      "Onésimo e Filemom",
      "Apelo pastoral",
      "Evangelho e relações",
      "Liberdade cristã",
      "Amor eficaz",
    ],
  },
  {
    id: "hebreus",
    name: "Hebreus",
    testament: "NT",
    desc: "Cristo superior: sacerdote e sacrifício.",
    points: [
      "Superior a anjos/Moisés",
      "Novo sacerdócio",
      "Sacrifício perfeito",
      "Perseverança",
      "Hb 11: fé",
    ],
  },
  {
    id: "tiago",
    name: "Tiago",
    testament: "NT",
    desc: "Fé prática que age na vida diária.",
    points: [
      "Provas e sabedoria",
      "Fé e obras",
      "Domar a língua",
      "Piedade social",
      "Oração e cura",
    ],
  },
  {
    id: "1pedro",
    name: "1 Pedro",
    testament: "NT",
    desc: "Esperança e santidade em meio ao sofrimento.",
    points: [
      "Eleitos peregrinos",
      "Sofrer por Cristo",
      "Exemplo de santidade",
      "Família e igreja",
      "1Pe 1:3-9",
    ],
  },
  {
    id: "2pedro",
    name: "2 Pedro",
    testament: "NT",
    desc: "Crescer na graça; alerta a falsos mestres.",
    points: [
      "Memória apostólica",
      "Firmeza profética",
      "Escarnecedores",
      "Dia do Senhor",
      "2Pe 3:18",
    ],
  },
  {
    id: "1joao",
    name: "1 João",
    testament: "NT",
    desc: "Certeza da salvação; amor e verdade.",
    points: [
      "Testes da fé",
      "Amar os irmãos",
      "Vencer o mundo",
      "Cristologia verdadeira",
      "1Jo 5:13",
    ],
  },
  {
    id: "2joao",
    name: "2 João",
    testament: "NT",
    desc: "Andar em amor e verdade; cautela com enganadores.",
    points: [
      "Amor na verdade",
      "Cristo vindo em carne",
      "Hospedagem criteriosa",
      "Vigiar-se",
      "Saudações breves",
    ],
  },
  {
    id: "3joao",
    name: "3 João",
    testament: "NT",
    desc: "Hospitalidade fiel vs ambição de Diótrefes.",
    points: [
      "Gaio elogiado",
      "Cooperação missionária",
      "Diótrefes censurado",
      "Bom testemunho",
      "Amizades na verdade",
    ],
  },
  {
    id: "judas",
    name: "Judas",
    testament: "NT",
    desc: "Contender pela fé contra falsos mestres.",
    points: [
      "Fé uma vez dada",
      "Exemplos do AT",
      "Falsos intrusos",
      "Guardar-se no amor",
      "Doxologia final",
    ],
  },
  {
    id: "apocalipse",
    name: "Apocalipse",
    testament: "NT",
    desc: "Revelação de Jesus: juízo, vitória e nova criação.",
    points: [
      "Cartas às igrejas",
      "Trono e Cordeiro",
      "Conflitos finais",
      "Queda da Babilônia",
      "Nova criação (Ap 21–22)",
    ],
  },
];

const TESTAMENTS = [
  { id: "ALL", label: "Todos" },
  { id: "AT", label: "Antigo Testamento" },
  { id: "NT", label: "Novo Testamento" },
];

const BookCard = ({ book }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="book-card" style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={styles.title}>{book.name}</h3>
          <p style={styles.desc}>{book.desc}</p>
        </div>
        <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
          {open ? "–" : "+"}
        </button>
      </div>

      {open && (
        <ul style={styles.list}>
          {book.points.map((p, i) => (
            <li key={i} style={styles.li}>
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BibleStudiesByBook = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("ALL");

  const filtered = useMemo(() => {
    return BOOKS.filter((b) => {
      const passTab = tab === "ALL" ? true : b.testament === tab;
      const passQuery = b.name.toLowerCase().includes(query.toLowerCase());
      return passTab && passQuery;
    });
  }, [query, tab]);

  return (
    <>
      <Header showProfileImage={false} navigate={navigate} />
    <div className="landingListingsContainer">
      <div style={styles.container}>
        <h1 style={styles.h1}>Estudos por Livro Bíblico</h1>
        <p style={styles.p}>Selecione um livro para ver um resumo e 5 pontos-chave.</p>

        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Buscar livro..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
          />
          <div style={styles.tabs}>
            {TESTAMENTS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  ...styles.tabBtn,
                  ...(tab === t.id ? styles.tabActive : {}),
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.grid}>
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

const styles = {
  container: { maxWidth: 1000, margin: "0 auto", padding: "16px" },
  h1: { margin: "8px 0 4px" },
  p: { margin: "0 0 16px", opacity: 0.9 },
  toolbar: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" },
  input: { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, minWidth: 220 },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  tabBtn: { padding: "8px 12px", borderRadius: 999, border: "1px solid #e2e2e2", background: "#fff", cursor: "pointer" },
  tabActive: { background: "#111", color: "#fff", borderColor: "#111" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 },
  card: { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" },
  title: { margin: "0 0 6px" },
  desc: { margin: 0, opacity: 0.9 },
  toggle: { borderRadius: 10, border: "1px solid #ddd", height: 36, width: 36, cursor: "pointer" },
  list: { margin: "10px 0 0 18px" },
  li: { marginBottom: 6 },
};

export default BibleStudiesByBook;
