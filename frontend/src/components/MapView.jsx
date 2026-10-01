import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { MAP, TILES } from '../config';
import { categorize } from '../lib/classification';

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    // Update these two keys to match the backend payload
    map.flyTo([target.centroid_latitude, target.centroid_longitude], Math.max(map.getZoom(), 9), { duration: 0.8 });
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

      {clusters.map((c) => {
      // 1. Extract from the nested analysis_bp object safely
      const finalClass = c.analysis_bp?.final_class || null;
      const isPersistent = c.analysis_bp?.is_persistant || false;
      
      const cat = categorize(finalClass, isPersistent);
      const isSelected = c.cluster_id === selectedId;
      
      return (
        <CircleMarker
          key={c.cluster_id}
          // 2. Use the correct centroid coordinate keys
          center={[c.centroid_latitude, c.centroid_longitude]}
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
        // Update the selection marker coordinates as well
        center={[selected.centroid_latitude, selected.centroid_longitude]}
        radius={15}
        interactive={false}
        pathOptions={{ color: '#9E1B1B', weight: 3, fill: false }}
      />
    )}
  </MapContainer>
  );
}
