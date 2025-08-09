import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const API = process.env.REACT_APP_API_BASE_URL;
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
      center: [-46.65, -23.6],
      zoom: 5, // dá um help pra separar se forem próximos
      pitch: 40,
      antialias: true,
    });
    mapRef.current = map;

    map.on("error", (e) => console.error("Mapbox error:", e?.error || e));

    map.on("load", async () => {
      try {
        map.setProjection("globe");
      } catch {}
      map.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.2,
        "space-color": "#000",
        "star-intensity": 0.15,
      });

      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true }),
        "top-right"
      );
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      const geo = new mapboxgl.GeolocateControl({
        trackUserLocation: false,
        showUserHeading: true,
      });
      map.addControl(geo, "top-right");

      map.setMinZoom(0.8);
      map.setMaxZoom(22);

      // 👉 Busca do backend
      let data;
      try {
        const res = await fetch(`${API}/api/admChurch/geojson`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } catch (err) {
        console.error("Falha ao carregar GeoJSON do backend:", err);
        return;
      }
      if (data?.type !== "FeatureCollection") {
        console.error("Formato inesperado do GeoJSON:", data);
        return;
      }

      // 🔎 DEBUG: logar coords e checar inversão
      const pts = (data.features || []).map((f) => f?.geometry?.coordinates);
      console.table(pts);
      const hasProbablySwapped = pts.some(
        ([x, y]) => Math.abs(x) < Math.abs(y)
      ); // em SP, |lon|≈46 > |lat|≈23
      if (hasProbablySwapped) {
        console.warn(
          "Possível coordenada invertida [lat,lng]. Esperado [lng,lat]."
        );
      }

      // Source
      if (map.getLayer("igrejas-layer")) map.removeLayer("igrejas-layer");
      if (map.getLayer("igrejas-label")) map.removeLayer("igrejas-label");
      if (map.getSource("igrejas")) map.removeSource("igrejas");
      map.addSource("igrejas", { type: "geojson", data });

      // Círculos (raio maior pra evidenciar 2 pontos)
      map.addLayer({
        id: "igrejas-layer",
        type: "circle",
        source: "igrejas",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            6, // antes era 4
            10,
            10, // antes era 7/10/12
            16,
            14,
            22,
            16,
          ],
          "circle-color": "#FFD700",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 1,
        },
        filter: ["==", ["geometry-type"], "Point"],
      });

      // Labels com o título (ajuda a ver que são dois)
      map.addLayer({
        id: "igrejas-label",
        type: "symbol",
        source: "igrejas",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["get", "title"],
          "text-size": 12,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      });

      // Popup
      map.on("click", "igrejas-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};

        const title = p.title || "Igreja";
        const desc = p.description || "";
        const churchId = p.id || p._id || ""; // <- pega o id correto
        const url = churchId ? `/church/${churchId}` : "#";

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
        })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `
      <div style="width:240px">
        <h4 style="margin:0 0 6px 0;">${title}</h4>
        <p style="margin:0 0 8px 0;color:#444">${desc}</p>
        <a href="${url}" style="color:#2A68D8;text-decoration:underline;">
          Ver página da igreja
        </a>
      </div>
    `
          )
          .addTo(map);
      });

      map.on(
        "mouseenter",
        "igrejas-layer",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "igrejas-layer",
        () => (map.getCanvas().style.cursor = "")
      );

      // Fit bounds (garante ver todas)
      const lons = pts.map((c) => c?.[0]).filter((v) => typeof v === "number");
      const lats = pts.map((c) => c?.[1]).filter((v) => typeof v === "number");
      if (lons.length && lats.length) {
        map.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 80, duration: 800 }
        );
      }

      // geolocalização opcional
      geo.on("geolocate", (pos) => {
        const { longitude, latitude } = pos.coords;
        map.easeTo({
          center: [longitude, latitude],
          zoom: 10,
          pitch: 45,
          duration: 1200,
        });
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
