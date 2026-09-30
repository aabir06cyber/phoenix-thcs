import { useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '../config';

/**
 * Subscribes to the backend SSE stream. EventSource reconnects automatically.
 * status: 'connecting' | 'live' | 'reconnecting'
 * Backend payloads: { event: 'new_fire_analyzed' | 'cluster_updated', ... }
 */
export function useClusterStream(onEvent) {
  const [status, setStatus] = useState('connecting');
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    const es = new EventSource(ENDPOINTS.stream);
    es.onopen = () => setStatus('live');
    es.onerror = () => setStatus('reconnecting');
    es.onmessage = (e) => {
      try {
        handler.current(JSON.parse(e.data));
      } catch (err) {
        console.warn('Ignoring malformed SSE payload', e.data, err);
      }
    };
    return () => es.close();
  }, []);

  return status;
}
