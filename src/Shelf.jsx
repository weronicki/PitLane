import React, { useEffect, useRef, useState } from 'react';
import {
  arrangeCars,
  fantasyCastingLabel,
  maxShelfRows,
  maxShelfSlots,
} from './collection.js';
import { getCarPaint } from './cars.js';
import { collectionApi } from './collectionApi.js';
import { photoTransform } from './PhotoFraming.jsx';

const rowOptions = Array.from(
  { length: maxShelfRows },
  (_, index) => index + 1,
);
const slotOptions = Array.from(
  { length: maxShelfSlots },
  (_, index) => index + 1,
);
const dragType = 'application/x-pit-lane-shelf-slot';

function ShelfPhoto({ car, version }) {
  const url = `${collectionApi}/photo/${encodeURIComponent(car.id)}?v=${version}`;
  const [failedUrl, setFailedUrl] = useState(null);

  return (
    <span className="shelf-photo" aria-hidden="true">
      {car.hasPhoto && failedUrl !== url ? (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          draggable={false}
          style={{ transform: photoTransform(car.photoFrame) }}
          onError={() => setFailedUrl(url)}
        />
      ) : (
        'No photo'
      )}
    </span>
  );
}

export default function Shelf({
  cars,
  photoVersions,
  hidden,
  locationRequest,
  settings,
  disabled,
  onChange,
}) {
  const { rowCount, slotsPerRow, placement } = settings;
  const locatedSlot = useRef(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);

  const capacity = rowCount * slotsPerRow;
  const slots = arrangeCars(cars, placement);
  const occupied = slots.slice(0, capacity).filter(Boolean).length;
  const free = capacity - occupied;
  const overflow = cars.length - occupied;
  const trayDropSlot = Math.max(capacity, slots.length);

  useEffect(() => {
    if (hidden || !locationRequest || !locatedSlot.current) return;
    locatedSlot.current.focus({ preventScroll: true });
    locatedSlot.current.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [hidden, locationRequest]);

  function moveCar(from, to) {
    if (
      disabled ||
      !Number.isInteger(from) ||
      from < 0 ||
      from === to ||
      !slots[from]
    )
      return;
    const next = Array.from(
      { length: Math.max(trayDropSlot, to + 1) },
      (_, index) => slots[index]?.id ?? null,
    );
    [next[from], next[to]] = [next[to], next[from]];
    while (next.length > capacity && next.at(-1) === null) next.pop();
    onChange({ ...settings, placement: next });
  }

  function chooseSlot(index) {
    if (selectedSlot === null) {
      if (slots[index]) setSelectedSlot(index);
      return;
    }
    moveCar(selectedSlot, index);
    setSelectedSlot(null);
  }

  function changeDimensions(dimensions) {
    setSelectedSlot(null);
    onChange({ ...settings, ...dimensions });
  }

  function endDrag() {
    setSelectedSlot(null);
    setDragTarget(null);
  }

  function renderSlot(index, label, emptyText, key = index) {
    const car = slots[index];
    const located = Boolean(car && car.id === locationRequest?.carId);
    return (
      <li key={key}>
        <button
          type="button"
          className={car ? 'shelf-slot' : 'shelf-slot shelf-slot-empty'}
          ref={located ? locatedSlot : null}
          data-located={located || undefined}
          aria-label={label}
          title={car ? label : undefined}
          aria-pressed={selectedSlot === index}
          data-drag-target={dragTarget === index}
          disabled={disabled}
          draggable={Boolean(car) && !disabled}
          onClick={() => chooseSlot(index)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') endDrag();
          }}
          onDragStart={(event) => {
            event.dataTransfer.setData(dragType, String(index));
            event.dataTransfer.effectAllowed = 'move';
            setSelectedSlot(null);
          }}
          onDragOver={(event) => {
            if (disabled || !event.dataTransfer.types.includes(dragType))
              return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragTarget(index);
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget;
            if (
              !(nextTarget instanceof Node) ||
              !event.currentTarget.contains(nextTarget)
            )
              setDragTarget(null);
          }}
          onDrop={(event) => {
            const from = event.dataTransfer.getData(dragType);
            if (from === '') return;
            event.preventDefault();
            moveCar(Number(from), index);
            endDrag();
          }}
          onDragEnd={endDrag}
        >
          {car ? (
            <>
              {photoMode && (
                <ShelfPhoto
                  key={car.id}
                  car={car}
                  version={photoVersions[car.id] ?? 0}
                />
              )}
              <span
                className="shelf-brand"
                style={{ '--paint': getCarPaint(car) }}
              >
                {car.brand}
              </span>
              <strong>{car.model}</strong>
              <span className="car-year">
                {car.year ?? fantasyCastingLabel}
              </span>
            </>
          ) : (
            <span>{emptyText}</span>
          )}
        </button>
      </li>
    );
  }

  return (
    <section
      className={photoMode ? 'shelf shelf-photo-mode' : 'shelf'}
      id="display-shelf"
      style={{ '--shelf-columns': slotsPerRow }}
      hidden={hidden}
      aria-labelledby="shelf-title"
    >
      <div className="shelf-header">
        <div>
          <h3 id="shelf-title">Display shelf</h3>
          <p className="catalog-message">
            {placement
              ? 'Custom arrangement.'
              : 'Grouped by brand, oldest real car first within each brand.'}
          </p>
        </div>
        <div className="shelf-controls">
          <button
            type="button"
            className="secondary-button shelf-photo-toggle"
            aria-pressed={photoMode}
            onClick={() => setPhotoMode((enabled) => !enabled)}
          >
            Photo mode
          </button>
          <label>
            Rows
            <select
              value={rowCount}
              disabled={disabled}
              onChange={(event) =>
                changeDimensions({ rowCount: Number(event.target.value) })
              }
            >
              {rowOptions.map((count) => (
                <option key={count}>{count}</option>
              ))}
            </select>
          </label>
          <label>
            Slots per row
            <select
              value={slotsPerRow}
              disabled={disabled}
              onChange={(event) =>
                changeDimensions({ slotsPerRow: Number(event.target.value) })
              }
            >
              {slotOptions.map((count) => (
                <option key={count}>{count}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <p className="shelf-count" role="status">
        {occupied} of {capacity} slots filled · {free} free
        {overflow > 0 && ` · ${overflow} off the shelf`}
      </p>
      <p className="shelf-instructions" role="status">
        {selectedSlot === null
          ? 'Drag a car to a slot, or select a car and then select its destination.'
          : 'Select a destination, or select the same car to cancel.'}
      </p>
      <div
        className="shelf-scroll"
        role="region"
        aria-label="Shelf rows"
        tabIndex={0}
      >
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <div className="shelf-row" key={rowIndex}>
            <h4>Row {rowIndex + 1}</h4>
            <ol className="shelf-slots">
              {Array.from({ length: slotsPerRow }, (_, slotIndex) => {
                const index = rowIndex * slotsPerRow + slotIndex;
                const car = slots[index];
                const label = `Row ${rowIndex + 1}, slot ${slotIndex + 1}: ${car ? `${car.brand} ${car.model}, ${car.year ?? fantasyCastingLabel}` : 'empty'}`;
                return renderSlot(index, label, 'Empty slot');
              })}
            </ol>
          </div>
        ))}
      </div>
      <section className="off-shelf" aria-labelledby="off-shelf-title">
        <div className="off-shelf-header">
          <h4 id="off-shelf-title">Off-shelf tray</h4>
          <span>
            {overflow} {overflow === 1 ? 'car' : 'cars'}
          </span>
        </div>
        <p className="shelf-instructions">
          Move a tray car onto the shelf, or use the tray’s drop spot to free a
          shelf slot.
        </p>
        <ul className="off-shelf-slots">
          {renderSlot(
            trayDropSlot,
            'Move car off the shelf',
            'Drop a car here',
            'tray-drop',
          )}
          {slots
            .slice(capacity)
            .map(
              (car, offset) =>
                car &&
                renderSlot(
                  capacity + offset,
                  `Off shelf: ${car.brand} ${car.model}, ${car.year ?? fantasyCastingLabel}`,
                  '',
                  `tray-${car.id}`,
                ),
            )}
        </ul>
      </section>
    </section>
  );
}
