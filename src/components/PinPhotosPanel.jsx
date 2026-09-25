import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const MAX_PX = 1200;
const JPEG_QUALITY = 0.8;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;
      const longest = Math.max(w, h);
      const scale = longest > MAX_PX ? MAX_PX / longest : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for compression'));
    };

    img.src = objectUrl;
  });
}

export default function PinPhotosPanel({ pin, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPhotos();
  }, [pin.id]);

  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('pin_photos')
      .select('*')
      .eq('pin_id', pin.id)
      .order('created_at', { ascending: false });
    if (!error) setPhotos(data ?? []);
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    let blob;
    try {
      blob = await compressImage(file);
    } catch {
      setError('Could not compress image. Please try a different photo.');
      setUploading(false);
      e.target.value = '';
      return;
    }

    const path = `${pin.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('pin-photos')
      .upload(path, blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      e.target.value = '';
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pin-photos')
      .getPublicUrl(path);

    const { error: insertError } = await supabase
      .from('pin_photos')
      .insert([{ pin_id: pin.id, photo_url: publicUrl }]);

    if (insertError) {
      setError(`Photo uploaded but record could not be saved: ${insertError.message}`);
    } else {
      await fetchPhotos();
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleDelete(photo) {
    const marker = '/pin-photos/';
    const storagePath = photo.photo_url.includes(marker)
      ? photo.photo_url.split(marker)[1]
      : null;

    if (storagePath) {
      await supabase.storage.from('pin-photos').remove([storagePath]);
    }
    await supabase.from('pin_photos').delete().eq('id', photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal photos-modal">
        <div className="modal-header">
          <span aria-hidden="true">📷</span>
          <h2>{pin.note || 'Trailhead'}</h2>
        </div>

        <div className="photos-body">
          {error && <p className="photos-error">{error}</p>}

          {photos.length === 0 && !uploading ? (
            <p className="photos-empty">No photos yet.</p>
          ) : (
            <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-thumb">
                  <img src={photo.photo_url} alt="Trail photo" />
                  <button
                    className="photo-delete"
                    onClick={() => handleDelete(photo)}
                    aria-label="Delete photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {uploading && <div className="photo-thumb photo-uploading-slot" aria-hidden="true" />}
            </div>
          )}

          {uploading && <p className="photos-uploading">Uploading…</p>}
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '+ Add Photo'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
