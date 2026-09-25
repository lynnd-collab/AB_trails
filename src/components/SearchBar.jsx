import { useState, useRef } from 'react';

export default function SearchBar({ pins = [], onSelectPin }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const q = query.trim().toLowerCase();
  const pinResults = q.length > 0
    ? pins.filter((p) =>
        (p.note && p.note.toLowerCase().includes(q)) ||
        (p.trail_name && p.trail_name.toLowerCase().includes(q))
      )
    : [];

  const hasResults = pinResults.length > 0;

  function handleSelectPin(pin) {
    onSelectPin(pin);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="search"
        className="search-input"
        placeholder="Search waypoints…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Search waypoints"
      />
      {open && hasResults && (
        <ul className="search-results">
          {pinResults.map((p) => (
            <li
              key={p.id}
              className="search-result-item"
              onMouseDown={() => handleSelectPin(p)}
            >
              <span className="search-result-pin-note">📍 {p.note || 'Trailhead'}</span>
              {p.trail_name && (
                <span className="search-result-pin-trail">{p.trail_name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
