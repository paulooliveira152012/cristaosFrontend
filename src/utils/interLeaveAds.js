// src/utils/interleaveAds.js

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const uniqueIncreasing = (arr, maxPos) => {
  // garante ordem estritamente crescente e dentro do range
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) arr[i] = arr[i - 1] + 1;
  }
  // se estourar o limite, empurra para a esquerda
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] > maxPos) arr[i] = maxPos - (arr.length - 1 - i);
  }
  return arr.map((x) => clamp(x, 1, maxPos));
};

/**
 * Intercala todos os ads no feed.
 * Regras:
 *  - L <= 4  -> alterna listing/ad e depois coloca o resto dos ads.
 *  - L >= 5  -> distribui todos os ads em posições quase uniformes (com jitter opcional),
 *               evitando “cauda” (últimos N itens).
 *
 * @param {Array} listings - itens do feed (listings normalizados)
 * @param {Array} ads - array de ads [{_id, title, description, imageUrl, link, createdBy, ...}]
 * @param {{avoidTail?:number, jitter?:number}} opts
 *    avoidTail: quantos itens finais evitar para não colar ad no fim (padrão: 1)
 *    jitter: deslocamento aleatório máximo em torno das posições uniformes (padrão: 1)
 * @returns {Array} feed misto (listings + ads com {type:"ad", __adIndex})
 */
export function interleaveAds(listings = [], ads = [], opts = {}) {
  const L = Array.isArray(listings) ? listings.length : 0;
  const A = Array.isArray(ads) ? ads.length : 0;

  if (L === 0 && A === 0) return [];
  if (L === 0) {
    // Se não há listagens, ainda assim mostre todos os ads.
    return ads.map((ad, i) => ({ ...ad, type: "ad", __adIndex: i }));
  }
  if (A === 0) return listings;

  const { avoidTail = 1, jitter = 1 } = opts;

  // -------- Caso 1: poucas listagens (<= 4) -> alterna --------
  if (L <= 4) {
    const out = [];
    const maxLen = Math.max(L, A);
    for (let i = 0; i < maxLen; i++) {
      if (i < L) out.push(listings[i]);
      if (i < A) {
        const ad = ads[i];
        out.push({ ...ad, type: "ad", __adIndex: i });
      }
    }
    return out;
  }

  // -------- Caso 2: 5+ listagens -> distribui todos os ads --------
  // posições de inserção são "entre" itens: 1..(L - avoidTail)
  const maxInsertPos = Math.max(1, L - avoidTail);

  // Base uniformemente espaçada: pos ~ round((k+1) * (maxInsertPos+1) / (A+1))
  let positions = Array.from({ length: A }, (_, k) => {
    const base = Math.round(((k + 1) * (maxInsertPos + 1)) / (A + 1));
    // aplica jitter leve (±jitter)
    const delta = jitter > 0 ? Math.round((Math.random() * 2 - 1) * jitter) : 0;
    return clamp(base + delta, 1, maxInsertPos);
  });

  positions = uniqueIncreasing(positions, maxInsertPos);

  // constrói o feed inserindo após cada índice de listing correspondente
  const out = [];
  let adIdx = 0;

  for (let i = 0; i < L; i++) {
    out.push(listings[i]);

    // após inserir o item na posição i (0-based), a "fenda" seguinte é i+1
    while (adIdx < A && positions[adIdx] === i + 1) {
      const ad = ads[adIdx];
      out.push({ ...ad, type: "ad", __adIndex: adIdx });
      adIdx++;
    }
  }

  // Se ainda sobraram ads (por causa de avoidTail/jitter), anexa no fim (conforme pedido)
  while (adIdx < A) {
    const ad = ads[adIdx];
    out.push({ ...ad, type: "ad", __adIndex: adIdx });
    adIdx++;
  }

  return out;
}
