// src/ads/AdsBootstrap.js
import { useEffect, useRef } from "react";

export default function AdsBootstrap({ clientId }) {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current || !clientId) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    document.head.appendChild(s);
    injected.current = true;
  }, [clientId]);
  return null;
}
