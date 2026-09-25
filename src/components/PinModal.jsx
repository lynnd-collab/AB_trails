import { useState, useEffect, useRef } from 'react';

export default function PinModal({ initialNote = '', initialTrailName = '', isEditing = false, onSave, onCancel }) {
  const [note, setNote] = useState(initialNote);
  const [trail, setTrail] = useState(initialTrailName);
  const [saving, setSaving] = useState(false);
  const noteRef = useRef(null);

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(note.trim() || 'Trailhead', trail.trim() || null);
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <span>📍</span>
          <h2 id="modal-title">{isEditing ? 'Edit Waypoint' : 'New Waypoint'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="pin-note">Note</label>
              <textarea
                id="pin-note"
                ref={noteRef}
                rows={3}
                placeholder="e.g. Parking lot at trailhead, great views from summit…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pin-trail">Trail / Area</label>
              <input
                id="pin-trail"
                type="text"
                placeholder="Trail name"
                value={trail}
                onChange={(e) => setTrail(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Waypoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
