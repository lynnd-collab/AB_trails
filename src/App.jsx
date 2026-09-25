import { useState, useEffect, useCallback } from 'react';
import Map from './components/Map';
import PinModal from './components/PinModal';
import PinPhotosPanel from './components/PinPhotosPanel';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import { supabase } from './lib/supabase';

export default function App() {
  const [pins, setPins] = useState([]);
  const [photoSet, setPhotoSet] = useState(new Set());
  const [pendingPin, setPendingPin] = useState(null);
  const [photoPin, setPhotoPin] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const [flyToPin, setFlyToPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPins();
    fetchPhotoSet();
  }, []);

  async function fetchPhotoSet() {
    const { data } = await supabase.from('pin_photos').select('pin_id');
    if (data) setPhotoSet(new Set(data.map((r) => r.pin_id)));
  }

  async function fetchPins() {
    const { data, error } = await supabase
      .from('trailheads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Could not load trailheads. Check your Supabase setup.');
      console.error(error);
    } else {
      setPins(data);
    }
    setLoading(false);
  }

  const handleMapClick = useCallback((lng, lat) => {
    setPendingPin({ lng, lat });
  }, []);

  async function handleSavePin(note, trailName) {
    const { data, error } = await supabase
      .from('trailheads')
      .insert([{ longitude: pendingPin.lng, latitude: pendingPin.lat, note, trail_name: trailName }])
      .select()
      .single();

    if (error) {
      console.error('Save error:', error);
      alert('Failed to save waypoint. Check console for details.');
    } else {
      setPins((prev) => [data, ...prev]);
    }
    setPendingPin(null);
  }

  async function handleUpdatePin(note, trailName) {
    const { data, error } = await supabase
      .from('trailheads')
      .update({ note, trail_name: trailName })
      .eq('id', editingPin.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      alert('Failed to update waypoint. Check console for details.');
    } else {
      setPins((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    }
    setEditingPin(null);
  }

  async function handleDeletePin(id) {
    const { error } = await supabase.from('trailheads').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error);
    } else {
      setPins((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const handleFlyToComplete = useCallback(() => setFlyTo(null), []);
  const handleFlyToPinComplete = useCallback(() => setFlyToPin(null), []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <img src="/icon.svg" alt="" className="header-logo" />
          <h1>AB Trails</h1>
        </div>
        <SearchBar
          pins={pins}
          onSelectPin={(pin) => { setFlyToPin(pin); setSidebarOpen(false); }}
        />
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open trailheads list'}
        >
          {sidebarOpen ? '✕ Close' : `Trailheads (${pins.length})`}
        </button>
      </header>

      <main className="app-main">
        {loading && (
          <div className="loading">Loading trailheads…</div>
        )}

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <Map
          pins={pins}
          photoSet={photoSet}
          onMapClick={handleMapClick}
          onDeletePin={handleDeletePin}
          onEditPin={setEditingPin}
          onOpenPhotos={setPhotoPin}
          flyTo={flyTo}
          onFlyToComplete={handleFlyToComplete}
          flyToPin={flyToPin}
          onFlyToPinComplete={handleFlyToPinComplete}
        />

        <Sidebar
          open={sidebarOpen}
          pins={pins}
          onSelectPin={(pin) => {
            setFlyTo({ lng: pin.longitude, lat: pin.latitude });
            setSidebarOpen(false);
          }}
          onDeletePin={handleDeletePin}
        />

        {!sidebarOpen && (
          <div className="map-hint" aria-hidden="true">
            Tap map to drop a waypoint
          </div>
        )}
      </main>

      {pendingPin && (
        <PinModal
          onSave={handleSavePin}
          onCancel={() => setPendingPin(null)}
        />
      )}

      {editingPin && (
        <PinModal
          initialNote={editingPin.note || ''}
          initialTrailName={editingPin.trail_name || ''}
          isEditing
          onSave={handleUpdatePin}
          onCancel={() => setEditingPin(null)}
        />
      )}

      {photoPin && (
        <PinPhotosPanel
          pin={photoPin}
          onClose={() => setPhotoPin(null)}
        />
      )}
    </div>
  );
}
