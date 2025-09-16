import { useEffect, useState } from "react";

/**
 * Retorna true apenas depois de `delayMs` quando `active` for true.
 * Se `active` voltar a false, reseta imediatamente.
 */
export default function useDelayedMount(active, delayMs = 500) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let t;
    if (active) {
      t = setTimeout(() => setReady(true), delayMs);
    } else {
      setReady(false); // desmonte imediato quando a condição cai
    }
    return () => clearTimeout(t);
  }, [active, delayMs]);

  return ready;
}
