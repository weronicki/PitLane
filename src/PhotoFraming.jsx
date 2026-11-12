import React, { useEffect, useState } from 'react';
import { collectionApi } from './collectionApi.js';
import { defaultPhotoFrame } from './collection.js';

export function photoTransform(frame = defaultPhotoFrame) {
  return `translate(${frame.x}%, ${frame.y}%) scale(${frame.zoom})`;
}

export default function PhotoFraming({
  file,
  carId,
  frame,
  onChange,
  disabled,
}) {
  const [fileUrl, setFileUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const source = file
    ? fileUrl
    : `${collectionApi}/photo/${encodeURIComponent(carId)}`;

  function updateFrame(event) {
    onChange({ ...frame, [event.target.name]: Number(event.target.value) });
  }

  return (
    <fieldset className="photo-framing" disabled={disabled}>
      <legend>Frame photo</legend>
      <div className="photo-frame-preview">
        {source && (
          <img
            src={source}
            alt="Car photo framing preview"
            style={{ transform: photoTransform(frame) }}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {imageError && (
        <p className="form-error" role="alert">
          This photo cannot be previewed. Try a JPEG, PNG, or WebP image.
        </p>
      )}
      <div className="photo-frame-controls">
        <label>
          Zoom <output>{Math.round(frame.zoom * 100)}%</output>
          <input
            type="range"
            aria-label="Zoom"
            name="zoom"
            min="0.5"
            max="3"
            step="0.01"
            value={frame.zoom}
            onChange={updateFrame}
          />
        </label>
        <label>
          Horizontal position
          <input
            type="range"
            name="x"
            min="-50"
            max="50"
            step="1"
            value={frame.x}
            onChange={updateFrame}
          />
        </label>
        <label>
          Vertical position
          <input
            type="range"
            name="y"
            min="-50"
            max="50"
            step="1"
            value={frame.y}
            onChange={updateFrame}
          />
        </label>
      </div>
      <button
        type="button"
        className="secondary-button"
        onClick={() => onChange({ ...defaultPhotoFrame })}
      >
        Reset framing
      </button>
    </fieldset>
  );
}
