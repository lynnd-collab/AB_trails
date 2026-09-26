import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const ALBERTA_CENTER = [-114.07, 51.05];
const ALBERTA_ZOOM = 8;

export default function Map({ pins, photoSet, onMapClick, onDeletePin, onEditPin, onOpenPhotos, flyTo, onFlyToComplete, flyToPin, onFlyToPinComplete }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const cameraElsRef = useRef({});
  const photoSetRef = useRef(photoSet);
  const onMapClickRef = useRef(onMapClick);
  const onDeletePinRef = useRef(onDeletePin);
  const onEditPinRef = useRef(onEditPin);
  const onOpenPhotosRef = useRef(onOpenPhotos);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onDeletePinRef.current = onDeletePin; }, [onDeletePin]);
  useEffect(() => { onEditPinRef.current = onEditPin; }, [onEditPin]);
  useEffect(() => { onOpenPhotosRef.current = onOpenPhotos; }, [onOpenPhotos]);

  useEffect(() => {
    photoSetRef.current = photoSet;
    const show = (mapRef.current?.getZoom() ?? 0) >= 10;
    Object.entries(cameraElsRef.current).forEach(([id, el]) => {
      el.style.display = (show && photoSet.has(id)) ? 'block' : 'none';
    });
  }, [photoSet]);

  // Initialise map once
  useEffect(() => {
    const map = new mapboxgl.Map({
      accessToken: MAPBOX_TOKEN,
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: ALBERTA_CENTER,
      zoom: ALBERTA_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('click', (e) => {
      if (e.originalEvent.target.closest('.pin-marker')) return;
      onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
    });

    map.on('zoom', () => {
      const show = map.getZoom() >= 10;
      Object.entries(cameraElsRef.current).forEach(([id, el]) => {
        el.style.display = (show && photoSetRef.current.has(id)) ? 'block' : 'none';
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      cameraElsRef.current = {};
    };
  }, []);

  // Sync waypoint markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(pins.map((p) => p.id));

    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete cameraElsRef.current[id];
      }
    });

    pins.forEach((pin) => {
      const existing = markersRef.current[pin.id];
      if (existing) {
        const el = existing.getElement();
        if (el.dataset.note === (pin.note || '') && el.dataset.trail === (pin.river_name || '')) return;
        existing.remove();
        delete markersRef.current[pin.id];
        delete cameraElsRef.current[pin.id];
      }

      const el = document.createElement('div');
      el.className = 'pin-marker';
      el.setAttribute('aria-label', pin.note || 'Trailhead');
      el.textContent = '📍';
      el.dataset.note = pin.note || '';
      el.dataset.trail = pin.river_name || '';

      const cameraBadge = document.createElement('div');
      cameraBadge.className = 'pin-photo-badge';
      cameraBadge.textContent = '📷';
      cameraBadge.setAttribute('aria-hidden', 'true');
      const atZoom10 = (mapRef.current?.getZoom() ?? 0) >= 10;
      cameraBadge.style.display = (atZoom10 && photoSetRef.current.has(pin.id)) ? 'block' : 'none';
      el.appendChild(cameraBadge);
      cameraElsRef.current[pin.id] = cameraBadge;

      const dateStr = new Date(pin.created_at).toLocaleDateString('en-CA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}`;

      const popup = new mapboxgl.Popup({ offset: 28, closeButton: true })
        .setHTML(
          `<div class="pin-popup">
            <p class="pin-popup-note">${pin.note || 'Trailhead'}</p>
            ${pin.river_name ? `<p class="pin-popup-trail">🥾 ${pin.river_name}</p>` : ''}
            <p class="pin-popup-date">${dateStr}</p>
            <a class="pin-popup-directions" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Get Directions</a>
            <button class="pin-popup-photos">📷 Photos</button>
            <button class="pin-popup-edit">✏️ Edit</button>
            <button class="pin-popup-delete">Delete this waypoint</button>
          </div>`
        );

      let listenersAdded = false;
      popup.on('open', () => {
        if (listenersAdded) return;
        listenersAdded = true;
        const el = popup.getElement();
        el?.querySelector('.pin-popup-delete')
          ?.addEventListener('click', () => onDeletePinRef.current(pin.id));
        el?.querySelector('.pin-popup-photos')
          ?.addEventListener('click', () => {
            popup.remove();
            onOpenPhotosRef.current(pin);
          });
        el?.querySelector('.pin-popup-edit')
          ?.addEventListener('click', () => {
            popup.remove();
            onEditPinRef.current(pin);
          });
      });

      markersRef.current[pin.id] = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map);
    });
  }, [pins]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 13, duration: 1200 });
    onFlyToComplete?.();
  }, [flyTo, onFlyToComplete]);

  useEffect(() => {
    if (!flyToPin || !mapRef.current) return;
    const map = mapRef.current;
    const marker = markersRef.current[flyToPin.id];
    map.flyTo({ center: [flyToPin.longitude, flyToPin.latitude], zoom: 13, duration: 1200 });
    map.once('moveend', () => {
      if (marker && !marker.getPopup().isOpen()) marker.togglePopup();
    });
    onFlyToPinComplete?.();
  }, [flyToPin, onFlyToPinComplete]);

  async function downloadOfflineMap() {
    if (!mapRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadPct(0);

    const map = mapRef.current;
    const origCenter = map.getCenter();
    const origZoom = map.getZoom();

    const minLng = -120, maxLng = -110, minLat = 49, maxLat = 60;

    const zoomConfigs = [
      { zoom: 5, stepLng: 12,  stepLat: 10  },
      { zoom: 6, stepLng: 6,   stepLat: 5   },
      { zoom: 7, stepLng: 3,   stepLat: 2.5 },
      { zoom: 8, stepLng: 1.5, stepLat: 1.2 },
    ];

    const positions = [];
    for (const { zoom, stepLng, stepLat } of zoomConfigs) {
      for (let lat = minLat + stepLat / 2; lat < maxLat; lat += stepLat) {
        for (let lng = minLng + stepLng / 2; lng < maxLng; lng += stepLng) {
          positions.push({ center: [lng, lat], zoom });
        }
      }
    }

    const total = positions.length;
    for (let i = 0; i < total; i++) {
      const { center, zoom } = positions[i];
      map.jumpTo({ center, zoom });
      await new Promise((resolve) => {
        const t = setTimeout(resolve, 3000);
        map.once('idle', () => { clearTimeout(t); resolve(); });
      });
      setDownloadPct(Math.round(((i + 1) / total) * 100));
    }

    map.flyTo({ center: [origCenter.lng, origCenter.lat], zoom: origZoom, duration: 800 });
    setIsDownloading(false);
  }

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <div className="offline-controls">
        {isDownloading ? (
          <div className="offline-progress" role="status" aria-live="polite">
            <span>Saving map… {downloadPct}%</span>
            <div className="offline-bar" aria-hidden="true">
              <div className="offline-bar-fill" style={{ width: `${downloadPct}%` }} />
            </div>
          </div>
        ) : (
          <button
            className="offline-btn"
            onClick={downloadOfflineMap}
            title="Download Alberta map tiles for offline use"
          >
            ↓ Save offline
          </button>
        )}
      </div>
    </div>
  );
}
