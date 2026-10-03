import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, GeoJSON, Pane, useMap } from 'react-leaflet';
import { MAP, TILES } from '../config';
import { categorize } from '../lib/classification';

import indiaBoundary from '../data/india-boundary.json';
const BOUNDARY_STYLE = { color: '#9e1b1b', weight: 1, opacity: 0.6, fillOpacity: 0, interactive: false };

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 9), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function MapView({ clusters, selectedId, onSelect, flyTarget }) {
  const selected = clusters.find((c) => c.cluster_id === selectedId);

  return (
    <MapContainer
      center={MAP.center}
      zoom={MAP.zoom}
      minZoom={MAP.minZoom}
      zoomControl={false}
      preferCanvas
      className="h-full w-full"
    >
      <ZoomControl position="topleft" />
      <TileLayer url={TILES.url} attribution={TILES.attribution} maxZoom={TILES.maxZoom} />
      <FlyTo target={flyTarget} />
      
      <Pane name="india-boundary" style={{ zIndex: 450, pointerEvents: 'none' }}>
        <GeoJSON data={indiaBoundary} style={() => BOUNDARY_STYLE} />
      </Pane>
      
      {clusters.map((c) => {
        const cat = categorize(c.final_class, c.is_persistant);
        const isSelected = c.cluster_id === selectedId;
        return (
          <CircleMarker
            key={c.cluster_id}
            center={[c.latitude, c.longitude]}
            radius={isSelected ? 9 : 7}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: cat.color, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(c.cluster_id) }}
          >
            <Tooltip className="cluster-tip" direction="top" offset={[0, -6]}>
              {c.cluster_id}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {selected && (
        <CircleMarker
          center={[selected.latitude, selected.longitude]}
          radius={15}
          interactive={false}
          pathOptions={{ color: '#9E1B1B', weight: 3, fill: false }}
        />
      )}
    </MapContainer>
  );
}
