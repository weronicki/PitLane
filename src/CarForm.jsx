import React, { useState } from 'react';
import PhotoFraming from './PhotoFraming.jsx';
import { defaultPhotoFrame } from './collection.js';

export default function CarForm({
  car,
  prefill,
  saving,
  saveError,
  onSave,
  onRemove,
  onCancel,
}) {
  const initial = car ?? prefill;
  const [draft, setDraft] = useState({
    brand: initial?.brand ?? '',
    model: initial?.model ?? '',
    year: initial?.year ?? '',
    releaseYear: initial?.releaseYear ?? '',
    series: initial?.series ?? '',
    releaseColor: initial?.releaseColor ?? '',
    toyNumber: initial?.toyNumber ?? '',
    photoFrame: initial?.photoFrame ?? { ...defaultPhotoFrame },
  });
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (saving || confirmingRemoval) return;
    const brand = draft.brand.trim();
    const model = draft.model.trim();
    if (!brand || !model) {
      setError('Enter both a brand and a model.');
      return;
    }
    setError('');
    onSave(
      {
        brand,
        model,
        year: draft.year === '' ? null : Number(draft.year),
        color: car?.color,
        releaseYear:
          draft.releaseYear === '' ? undefined : Number(draft.releaseYear),
        series: draft.series.trim() || undefined,
        releaseColor: draft.releaseColor.trim() || undefined,
        toyNumber: draft.toyNumber.trim() || undefined,
        catalogTitle: initial?.catalogTitle,
        photoFrame: draft.photoFrame,
      },
      { photoFile, removePhoto },
    );
  }

  return (
    <form className="editor" onSubmit={handleSubmit}>
      <h3>{car ? 'Edit car' : 'Add a car'}</h3>
      {prefill && (
        <p className="catalog-message">
          Check the imported details and enter the real car’s year if
          applicable.
        </p>
      )}
      <div className="fields car-fields">
        <label>
          Brand
          <input
            name="brand"
            value={draft.brand}
            onChange={updateField}
            required
            maxLength={40}
            autoFocus
          />
        </label>
        <label>
          Model
          <input
            name="model"
            value={draft.model}
            onChange={updateField}
            required
            maxLength={60}
          />
        </label>
        <label>
          Real car year (optional)
          <input
            name="year"
            type="number"
            min="1886"
            max="2100"
            step="1"
            value={draft.year}
            onChange={updateField}
          />
        </label>
      </div>
      <fieldset className="release-fields">
        <legend>
          Hot Wheels release <small>(optional)</small>
        </legend>
        <div className="fields">
          <label>
            Release year
            <input
              name="releaseYear"
              type="number"
              min="1968"
              max="2100"
              step="1"
              value={draft.releaseYear}
              onChange={updateField}
            />
          </label>
          <label>
            Series
            <input
              name="series"
              value={draft.series}
              onChange={updateField}
              maxLength={120}
            />
          </label>
          <label>
            Release color
            <input
              name="releaseColor"
              value={draft.releaseColor}
              onChange={updateField}
              maxLength={120}
            />
          </label>
          <label>
            Toy number
            <input
              name="toyNumber"
              value={draft.toyNumber}
              onChange={updateField}
              maxLength={40}
            />
          </label>
        </div>
      </fieldset>
      <div className="photo-field">
        <label>
          Car photo <small>(optional)</small>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            disabled={saving}
            onChange={(event) => {
              setPhotoFile(event.target.files[0] ?? null);
              setRemovePhoto(false);
              setDraft((previous) => ({
                ...previous,
                photoFrame: { ...defaultPhotoFrame },
              }));
            }}
          />
        </label>
        <p className="catalog-message">
          Use the sliders to frame the side view. Leave a little space around
          the car.
        </p>
        {car?.hasPhoto && !photoFile && (
          <label className="remove-photo">
            <input
              type="checkbox"
              checked={removePhoto}
              disabled={saving}
              onChange={(event) => setRemovePhoto(event.target.checked)}
            />{' '}
            Remove current photo
          </label>
        )}
      </div>
      {(photoFile || (car?.hasPhoto && !removePhoto)) && (
        <PhotoFraming
          file={photoFile}
          carId={car?.id}
          frame={draft.photoFrame}
          disabled={saving}
          onChange={(photoFrame) =>
            setDraft((previous) => ({ ...previous, photoFrame }))
          }
        />
      )}
      {(error || saveError) && (
        <p className="form-error" role="alert">
          {error || saveError}
        </p>
      )}
      {confirmingRemoval ? (
        <div className="remove-confirmation">
          <p id="remove-car-confirmation">
            Remove{' '}
            <strong>
              {car.brand} {car.model}
            </strong>{' '}
            from your collection? This also removes its photo and shelf
            placement.
          </p>
          <div className="editor-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirmingRemoval(false)}
              disabled={saving}
              autoFocus
            >
              Keep car
            </button>
            <button
              type="button"
              className="danger-button"
              aria-describedby="remove-car-confirmation"
              onClick={onRemove}
              disabled={saving}
            >
              {saving ? 'Removing…' : 'Confirm removal'}
            </button>
          </div>
        </div>
      ) : (
        <div className="editor-actions">
          {car && (
            <button
              type="button"
              className="secondary-button remove-car-button"
              onClick={() => {
                setError('');
                setConfirmingRemoval(true);
              }}
              disabled={saving}
            >
              Remove car
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save car'}
          </button>
        </div>
      )}
    </form>
  );
}
