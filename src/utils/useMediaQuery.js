// documento para especificar quando nao mostrar anuncios com base na largura da tela

import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  // evita erro em SSR e previne mismatch de hidratação
  const getMatch = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = e => setMatches(e.matches);
    // set inicial (caso o hook monte antes de medir)
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
