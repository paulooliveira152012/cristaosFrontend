const strip = (s = "") =>
  s
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function levenshtein(a, b) {
  a = strip(a);
  b = strip(b);
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return m[a.length][b.length];
}

export const normalizeDenomination = (input = "") => {
  const s = strip(input);
  if (!s) return "";
  const targets = [
    { key: "protestante", aliases: ["evangelico", "evangelica", "protestant"] },
    { key: "católico", aliases: ["catolica", "catolico", "romana"] },
    { key: "ortodoxo", aliases: ["ortodoxa"] },
    { key: "anglicano", aliases: ["anglicana"] },
    { key: "luterano", aliases: ["luterana"] },
    { key: "presbiteriano", aliases: ["presbiteriana"] },
    { key: "batista", aliases: [] },
    { key: "pentecostal", aliases: [] },
  ];
  for (const t of targets) {
    if (s.includes(t.key) || t.aliases.some((a) => s.includes(a))) return t.key;
  }
  let best = { key: "", d: Infinity };
  for (const t of targets) {
    [t.key, ...t.aliases].forEach((c) => {
      const d = levenshtein(s, c);
      if (d < best.d) best = { key: t.key, d };
    });
  }
  return best.d <= 3 ? best.key : input;
}