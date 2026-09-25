export default function Sidebar({ open, pins, onSelectPin, onDeletePin }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="sidebar-header">
        <span>📍</span> Trailheads ({pins.length})
      </div>

      <div className="sidebar-list">
        {pins.length === 0 ? (
          <div className="sidebar-empty">
            <p>No waypoints saved yet.</p>
            <p style={{ marginTop: 8 }}>Tap anywhere on the map to drop a waypoint.</p>
          </div>
        ) : (
          pins.map((pin) => (
            <div
              key={pin.id}
              className="pin-card"
              onClick={() => onSelectPin(pin)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectPin(pin)}
            >
              <span className="pin-card-icon">📍</span>

              <div className="pin-card-content">
                <div className="pin-card-note">{pin.note || 'Trailhead'}</div>
                {pin.trail_name && (
                  <div className="pin-card-trail">🥾 {pin.trail_name}</div>
                )}
                <div className="pin-card-date">
                  {new Date(pin.created_at).toLocaleDateString('en-CA', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </div>
              </div>

              <button
                className="pin-delete"
                aria-label="Delete waypoint"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePin(pin.id);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
