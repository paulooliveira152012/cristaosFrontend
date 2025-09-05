import React from "react";

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function MeetingList({ items, onEdit, onDelete }) {
  if (!items?.length) return <p>Nenhuma reunião cadastrada.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
      {items.map((m) => {
        const key = m._id || m.id;
        const title = m.name || m.title || "Sem título";
        const when = formatDateTime(m.meetingDate);

        // tenta pegar coords de m.lng/lat; se não tiver, pega de location
        let lng = m.lng, lat = m.lat;
        if (
          (lng === undefined || lat === undefined) &&
          m.location?.type === "Point" &&
          Array.isArray(m.location.coordinates) &&
          m.location.coordinates.length === 2
        ) {
          lng = m.location.coordinates[0];
          lat = m.location.coordinates[1];
        }
        const nLng = Number(lng);
        const nLat = Number(lat);
        const hasCoords = Number.isFinite(nLng) && Number.isFinite(nLat);

        const coordsText = hasCoords ? `${nLat.toFixed(5)}, ${nLng.toFixed(5)}` : null;
        const gmapsHref = hasCoords ? `https://www.google.com/maps?q=${nLat},${nLng}` : null;

        return (
          <li
            key={key}
            style={{
              border: "1px solid #e2e2e2",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 16 }}>{title}</strong>

                <div style={{ marginTop: 4, opacity: 0.8 }}>
                  {when && (
                    <div>
                      📅 <span>{when}</span>
                    </div>
                  )}
                  {(m.address || hasCoords) && (
                    <div>
                      📍{" "}
                      {m.address ? <span>{m.address}</span> : <span>{coordsText}</span>}
                      {gmapsHref && (
                        <>
                          {" "}
                          •{" "}
                          <a href={gmapsHref} target="_blank" rel="noreferrer">
                            Ver no mapa
                          </a>
                        </>
                      )}
                    </div>
                  )}
                  {m.website && (
                    <div>
                      🔗{" "}
                      <a href={m.website} target="_blank" rel="noreferrer">
                        Site oficial
                      </a>
                    </div>
                  )}
                </div>

                {m.summary && (
                  <div style={{ marginTop: 8, opacity: 0.95 }}>{m.summary}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
                <button onClick={() => onEdit?.(m)}>Editar</button>
                <button onClick={() => onDelete?.(m)} style={{ color: "#b00020" }}>
                  Deletar
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
