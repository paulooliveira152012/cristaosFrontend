import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function ChurchGlobe() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.3,
      pitch: 40,
      antialias: true,
    });
    mapRef.current = map;

    map.on("load", () => {
      // Globo + atmosfera
      try { map.setProjection("globe"); } catch {}
      map.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.2,
        "space-color": "#000",
        "star-intensity": 0.15,
      });

      // Controles
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      const geo = new mapboxgl.GeolocateControl({ trackUserLocation: false, showUserHeading: true });
      map.addControl(geo, "top-right");

      map.setMinZoom(0.8);
      map.setMaxZoom(22);

      // ---- REFERÊNCIA AO TILESET DO MAPBOX ----
      map.addSource("igrejas", {
        type: "vector",
        url: "mapbox://paulooliveira152012.cme3kgdc921j21pqqlzuyprso-3ana2", // seu Tileset ID
      });

      map.addLayer({
        id: "igrejas-layer",
        type: "circle",
        source: "igrejas",
        // ATENÇÃO: 'source-layer' é o nome do layer dentro do tileset (aparece na esquerda no Studio).
        "source-layer": "igrejas",
        paint: {
          "circle-radius": 7,
          "circle-color": "#FFD700",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Popup ao clicar
      map.on("click", "igrejas-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties || {};
        const place = props.place_name || "Igreja";
        const id = props.mapbox_id || "";

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="width:220px">
              <h4 style="margin:0 0 6px 0;">${place}</h4>
              <a href="/church/${id || ""}" style="color:#2A68D8;text-decoration:underline;">Ver página</a>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "igrejas-layer", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "igrejas-layer", () => { map.getCanvas().style.cursor = ""; });

      // (Opcional) ao geolocalizar, dar um zoom nível 10 no local do usuário
      geo.on("geolocate", (pos) => {
        const { longitude, latitude } = pos.coords;
        map.easeTo({ center: [longitude, latitude], zoom: 10, pitch: 45, duration: 1200 });
      });
    });

    return () => {
      try { popupRef.current?.remove(); map.remove(); } catch {}
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
