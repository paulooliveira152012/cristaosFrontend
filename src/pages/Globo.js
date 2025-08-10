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
      zoom: 5,
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

      // ---- Busca dos dois GeoJSONs ----
      let churchesFC, meetingsFC;
      try {
        console.log("buscando igrejas e meetings...", API);
        const [rChurch, rMeeting] = await Promise.all([
          fetch(`${API}/api/admChurch/geojson`),
          fetch(`${API}/api/intermeeting/geojson`),
        ]);
        if (!rChurch.ok)
          throw new Error(`church geojson HTTP ${rChurch.status}`);
        if (!rMeeting.ok)
          throw new Error(`intermeetings geojson HTTP ${rMeeting.status}`);

        churchesFC = await rChurch.json();
        meetingsFC = await rMeeting.json();

        // 👉 só loga DEPOIS de parsear
        console.log("church points:", churchesFC?.features?.length || 0);
        console.log("meeting points:", meetingsFC?.features?.length || 0);

        if (churchesFC?.type !== "FeatureCollection") {
          console.error("Church FC inválido:", churchesFC);
          return;
        }
        if (meetingsFC?.type !== "FeatureCollection") {
          console.error("Meeting FC inválido:", meetingsFC);
          return;
        }
      } catch (err) {
        console.error("Falha ao carregar GeoJSON do backend:", err);
        return;
      }

      // ---- limpa fontes/layers se já existirem (hot-reload) ----
      [
        "churches-labels",
        "churches-points",
        "meetings-labels",
        "meetings-points",
      ].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      ["churches-src", "meetings-src"].forEach((id) => {
        if (map.getSource(id)) map.removeSource(id);
      });

      // ---- Fontes ----
      map.addSource("churches-src", { type: "geojson", data: churchesFC });
      map.addSource("meetings-src", { type: "geojson", data: meetingsFC });

      // ---- Igrejas (amarelo) ----
      map.addLayer({
        id: "churches-points",
        type: "circle",
        source: "churches-src",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            5,
            10,
            8,
            16,
            12,
          ],
          "circle-color": "#FFD700",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 1,
        },
      });

      map.addLayer({
        id: "churches-labels",
        type: "symbol",
        source: "churches-src",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["get", "title"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-halo-color": "#fff", "text-halo-width": 1 },
      });

      // ---- Reuniões interdenominacionais (laranja) ----
      map.addLayer({
        id: "meetings-points",
        type: "circle",
        source: "meetings-src",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            6,
            10,
            9,
            16,
            13,
          ],
          "circle-color": ["coalesce", ["get", "pinColor"], "#FF6600"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 1,
        },
      });

      map.addLayer({
        id: "meetings-labels",
        type: "symbol",
        source: "meetings-src",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["get", "title"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-halo-color": "#fff", "text-halo-width": 1 },
      });

      // ---- Popups ----
      const openPopup = (f, tipo) => {
        const p = f.properties || {};
        const title = p.title || (tipo === "church" ? "Igreja" : "Reunião");
        const desc = p.description || "";
        const id = p.id || p._id || "";
        const href =
          p.url ||
          (tipo === "church" ? `/church/${id}` : `/intermeeting/${id}`);

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
        })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `
            <div style="width:240px">
              <div style="font-size:12px;opacity:.7;margin-bottom:4px">
                ${tipo === "church" ? "Igreja" : "Reunião interdenominacional"}
              </div>
              <h4 style="margin:0 0 6px 0;">${title}</h4>
              ${
                desc ? `<p style="margin:0 0 8px 0;color:#444">${desc}</p>` : ""
              }
              <a href="${href}" style="color:#2A68D8;text-decoration:underline;">Ver página</a>
            </div>
          `
          )
          .addTo(map);
      };

      map.on("click", "churches-points", (e) => {
        const f = e.features?.[0];
        if (f) openPopup(f, "church");
      });
      map.on("click", "meetings-points", (e) => {
        const f = e.features?.[0];
        if (f) openPopup(f, "meeting");
      });

      ["churches-points", "meetings-points"].forEach((id) => {
        map.on(
          "mouseenter",
          id,
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      });

      // ---- FitBounds com tudo ----
      const allCoords = [
        ...(churchesFC.features || [])
          .map((f) => f.geometry?.coordinates)
          .filter(Boolean),
        ...(meetingsFC.features || [])
          .map((f) => f.geometry?.coordinates)
          .filter(Boolean),
      ];
      if (allCoords.length) {
        const lons = allCoords.map((c) => c[0]);
        const lats = allCoords.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 70, duration: 800 }
        );
      }

      // Geolocalização opcional
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

  // Legendinha + container do mapa
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(255,255,255,.9)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          display: "flex",
          gap: 12,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: "#FFD700",
              borderRadius: 999,
              border: "1px solid #fff",
            }}
          />
          Igrejas
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: "#FF6600",
              borderRadius: 999,
              border: "1px solid #fff",
            }}
          />
          Reuniões
        </span>
      </div>
    </div>
  );
}
