// src/ads/GoogleAd.js
import { useEffect, useRef } from "react";

export default function GoogleAd({
  slot,                   // ex.: "3175280799" (OBRIGATÓRIO!)
  format = "fluid",       // "fluid" é mais suave para layouts responsivos
  layout = "",
  fullWidthResponsive = true,
  style,
  reserveHeight = 250,    // altura reservada p/ evitar layout shift
  collapseOnNoFillMs = 5000, // colapsa se não renderizar em X ms
  className = "",
  ariaLabel = "Publicidade",
}) {
  const ref = useRef(null);
  const observerRef = useRef(null);
  const pushedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tryPush = () => {
      if (pushedRef.current) return;
      if (window.adsbygoogle && el) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;

          // Se após X ms não tiver iframe (no-fill), colapsa
          timeoutRef.current = setTimeout(() => {
            const hasIframe = !!el.querySelector("iframe");
            if (!hasIframe) {
              el.style.minHeight = "0px";
              el.style.height = "0px";
              el.style.margin = "0";
            }
          }, collapseOnNoFillMs);
        } catch {
          // Silencia erros do AdSense
        }
      }
    };

    // Lazy-load via viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible) {
          tryPush();
          observerRef.current?.disconnect();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.01 }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [collapseOnNoFillMs]);

  // Estilo base: não bloquear scroll, reservar altura, responsivo
  const baseStyle = {
    display: "block",
    width: "100%",
    minHeight: reserveHeight,
    // Ajuda o navegador a entender que o gesto é de rolagem vertical
    // (reduz chance do iframe capturar o gesto):
    touchAction: "pan-y",
    // Garante que nada fique por cima do feed
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  return (
    <div className={`ad-slot ${className}`} aria-label={ariaLabel}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={baseStyle}
        data-ad-client={process.env.REACT_APP_ADS_CLIENT}  // ex.: "ca-pub-2091438910140305"
        data-ad-slot={slot}                                 // ex.: "3175280799"
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        data-adtest={process.env.NODE_ENV !== "production" ? "on" : undefined}
      />
    </div>
  );
}
