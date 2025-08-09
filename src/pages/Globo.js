import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function ChurchGlobe() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.3,
      pitch: 40,
      bearing: 0,
      antialias: true
    });
    mapRef.current = map;

    const onLoad = async () => {
      try { map.setProjection('globe'); } catch {}
      map.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.2,
        'space-color': '#000',
        'star-intensity': 0.15
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false, showUserHeading: true }), 'top-right');

      map.setMinZoom(0.8);
      map.setMaxZoom(22);

      const API = process.env.REACT_APP_API_BASE_URL;
      const res = await fetch(`${API}/api/churches`, { credentials: 'include' }).catch(() => null);
      const churches = (await res?.json()) || [];

      const fc = {
        type: 'FeatureCollection',
        features: churches
          .filter(c => Number.isFinite(c?.lng) && Number.isFinite(c?.lat))
          .map(c => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
            properties: {
              id: c._id,
              name: c.name,
              city: c.city,
              country: c.country,
              slug: c.slug,
              shortDescription: c.shortDescription || '',
              coverImage: c.coverImage || ''
            }
          }))
      };

      map.addSource('churches', {
        type: 'geojson',
        data: fc,
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 40
      });

      map.addLayer({
        id: 'church-clusters',
        type: 'circle',
        source: 'churches',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#2A68D8',
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 25, 24],
          'circle-opacity': 0.85
        }
      });

      map.addLayer({
        id: 'church-cluster-count',
        type: 'symbol',
        source: 'churches',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12
        },
        paint: { 'text-color': '#fff' }
      });

      map.addLayer({
        id: 'church-points',
        type: 'circle',
        source: 'churches',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00C389',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      const onClusterClick = (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['church-clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (!clusterId) return;
        const source = map.getSource('churches');
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      };

      const onPointClick = (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const { name, city, country, slug, shortDescription, coverImage } = f.properties;
        const [lng, lat] = f.geometry.coordinates;

        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 4), pitch: 50, speed: 0.8 });

        // fecha popup anterior
        popupRef.current?.remove();

        const html = `
          <div style="width: 220px">
            ${coverImage ? `<img src="${coverImage}" alt="${name}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
            <h4 style="margin:0 0 4px 0;">${name}</h4>
            <div style="font-size:12px;color:#666;margin-bottom:6px;">${city || ''}${city ? ', ' : ''}${country || ''}</div>
            <p style="margin:0 0 8px 0;font-size:13px;line-height:1.3;">${shortDescription || ''}</p>
            <a href="/church/${slug || f.properties.id}" style="color:#2A68D8;text-decoration:underline;">Ver página</a>
          </div>
        `;

        popupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat([lng, lat])
          .setHTML(html)
          .addTo(map);
      };

      const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
      const unsetPointer = () => (map.getCanvas().style.cursor = '');

      map.on('click', 'church-clusters', onClusterClick);
      map.on('click', 'church-points', onPointClick);
      map.on('mouseenter', 'church-points', setPointer);
      map.on('mouseleave', 'church-points', unsetPointer);
      map.on('mouseenter', 'church-clusters', setPointer);
      map.on('mouseleave', 'church-clusters', unsetPointer);

      // guarda pra cleanup
      map.__handlers = { onClusterClick, onPointClick, setPointer, unsetPointer };
    };

    map.on('load', onLoad);

    return () => {
      try {
        popupRef.current?.remove();
        if (map.__handlers) {
          map.off('click', 'church-clusters', map.__handlers.onClusterClick);
          map.off('click', 'church-points', map.__handlers.onPointClick);
          map.off('mouseenter', 'church-points', map.__handlers.setPointer);
          map.off('mouseleave', 'church-points', map.__handlers.unsetPointer);
          map.off('mouseenter', 'church-clusters', map.__handlers.setPointer);
          map.off('mouseleave', 'church-clusters', map.__handlers.unsetPointer);
        }
        map.remove();
      } catch {}
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
