// src/utils/interleaveAds.js
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Intercala ads dentro de listings com intervalos aleatórios, adaptando para feeds curtos.
 * @param {Array} listings - itens do feed (listings normalizados)
 * @param {Array} ads - array de ads [{_id, title, description, imageUrl, link, createdBy, ...}]
 * @param {{min?:number, max?:number, avoidTail?:number, ensureAtLeastOne?:boolean, maxAds?:number}} opts
 *   min/max: intervalo alvo de distância entre anúncios
 *   avoidTail: quantos itens finais evitar para não deixar ad colado no fim (padrão: 1)
 *   ensureAtLeastOne: garante ao menos 1 anúncio se houver listings (padrão: true)
 *   maxAds: limite superior de anúncios no feed (padrão: Infinity)
 * @returns {Array} feed misto
 */
export function interleaveAds(
  listings = [],
  ads = [],
  opts = {}
) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  if (!Array.isArray(ads) || ads.length === 0) return listings;

  const {
    min = 5,
    max = 9,
    avoidTail = 1,
    ensureAtLeastOne = true,
    maxAds = Infinity,
  } = opts;

  const L = listings.length;

  // Adapta os gaps para feeds curtos: pelo menos 1, no máx L-1
  const effectiveMin = Math.max(1, Math.min(min, Math.ceil(L / 2)));
  const effectiveMax = Math.max(effectiveMin, Math.min(max, Math.max(1, L - 1)));

  const out = [];
  let adIdx = 0;
  let adCount = 0;
  let distance = 0; // distância desde o último ad inserido
  let nextGap = randInt(effectiveMin, effectiveMax);

  for (let i = 0; i < L; i++) {
    const it = listings[i];
    out.push(it);
    distance += 1;

    // Pode inserir ad aqui?
    const notLastBlock = i < L - avoidTail; // evita cauda
    const gapReached = distance >= nextGap;
    const hasAdBudget = adCount < maxAds;

    if (gapReached && notLastBlock && hasAdBudget) {
      const ad = ads[adIdx % ads.length];
      out.push({
        ...ad,
        type: "ad",
        __adIndex: adIdx,
      });
      adIdx += 1;
      adCount += 1;
      distance = 0;
      nextGap = randInt(effectiveMin, effectiveMax);
    }
  }

  // Se nada foi inserido e queremos garantir ao menos 1 ad
  if (adCount === 0 && ensureAtLeastOne) {
    const insertAfter = Math.min(1, L - 1); // depois do primeiro item (se existir)
    const ad = ads[0];
    out.splice(insertAfter + insertAfter, 0, {
      ...ad,
      type: "ad",
      __adIndex: 0,
    });
  }

  return out;
}
