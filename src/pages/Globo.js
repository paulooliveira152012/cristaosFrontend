import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// URL estável do arquivo (evita ambiguidade de require)
const igrejasUrl = new URL("../utils/igrejas.geojson", import.meta.url).href;

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
      renderWorldCopies: false,
      center: [0, 20],
      zoom: 1.3,
      pitch: 40,
      antialias: true,
    });
    mapRef.current = map;

    map.on("error", (e) => console.error("Mapbox error:", e?.error || e));

    map.on("load", async () => {
      try { map.setProjection("globe"); } catch {}
      map.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.2,
        "space-color": "#000",
        "star-intensity": 0.15,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");

      const geo = new mapboxgl.GeolocateControl({ trackUserLocation: false, showUserHeading: true });
      map.addControl(geo, "top-right");

      map.setMinZoom(0.8);
      map.setMaxZoom(22);

      // 1) Carrega o GeoJSON
      let raw;
      try {
        const res = await fetch(igrejasUrl);
        raw = await res.json();
      } catch (err) {
        console.error("Falha ao carregar GeoJSON:", err);
        return;
      }

      // 2) Normaliza em UMA FeatureCollection (caso venha array)
      let data;
      if (Array.isArray(raw)) {
        const features = raw.flatMap(fc => fc?.features || []);
        data = { type: "FeatureCollection", features };
      } else if (raw?.type === "FeatureCollection") {
        data = raw;
      } else {
        console.error("Formato inesperado do GeoJSON:", raw);
        return;
      }

      // 3) Adiciona a fonte (sem cluster, simples)
      map.addSource("igrejas", {
        type: "geojson",
        data,
      });

      // 4) Layer de pontos
      map.addLayer({
        id: "igrejas-layer",
        type: "circle",
        source: "igrejas",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 12, 7, 18, 10, 22, 12],
          "circle-color": "#FFD700",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 1,
        },
        filter: ["==", ["geometry-type"], "Point"],
      });

      // 5) Popup ao clicar
      map.on("click", "igrejas-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties || {};
        const title = props.title || "Igreja";
        const desc = props.description || "";
         const url = props.url || "#"; // URL da página da igreja


        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(f.geometry.coordinates)
          .setHTML(`
            <div style="width:220px">
              <h4 style="margin:0 0 6px 0;">${title}</h4>
              <p style="margin:0;color:#444">${desc}</p>
              <a href="${url}" style="color:#2A68D8;text-decoration:underline;">Ver página da igreja</a>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "igrejas-layer", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "igrejas-layer", () => { map.getCanvas().style.cursor = ""; });

      // 6) Enquadra todos os pontos
      try {
        const coords = data.features
          .filter(f => f?.geometry?.type === "Point")
          .map(f => f.geometry.coordinates);
        if (coords.length) {
          const lons = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          const minLng = Math.min(...lons);
          const minLat = Math.min(...lats);
          const maxLng = Math.max(...lons);
          const maxLat = Math.max(...lats);
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
        }
      } catch (e) {
        console.warn("Não deu pra fazer fitBounds:", e);
      }

      // geolocalização opcional
      geo.on("geolocate", (pos) => {
        const { longitude, latitude } = pos.coords;
        map.easeTo({ center: [longitude, latitude], zoom: 10, pitch: 45, duration: 1200 });
      });
    });

    return () => {
      try {
        popupRef.current?.remove();
        map.remove();
      } catch {}
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
