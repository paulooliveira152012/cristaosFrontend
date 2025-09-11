// src/ads/GoogleAd.js
import { useEffect, useRef } from "react";

export default function GoogleAd({
  slot,                   // <-- use "3175280799"
  format = "auto",
  layout = "",
  fullWidthResponsive = true,
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    let tries = 0;
    const TICK = 300, MAX_TRIES = 20;
    const tick = () => {
      tries += 1;
      if (ref.current && window.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {}
        return;
      }
      if (tries < MAX_TRIES) setTimeout(tick, TICK);
    };
    tick();
  }, []);

  const baseStyle = { display: "block", minHeight: 250, ...style };

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={baseStyle}
      data-ad-client={process.env.REACT_APP_ADS_CLIENT}  // "ca-pub-2091438910140305"
      data-ad-slot={slot}                                 // "3175280799"
      data-ad-format={format}
      data-ad-layout={layout}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      data-adtest={process.env.NODE_ENV !== "production" ? "on" : undefined}
    />
  );
}
