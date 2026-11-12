import { paintColors } from './cars.js';

export const defaultShelf = { rowCount: 3, slotsPerRow: 6 };
export const maxShelfRows = 20;
export const maxShelfSlots = 12;
export const defaultPhotoFrame = { zoom: 1, x: 0, y: 0 };

export function isPhotoFrame(frame) {
  return (
    frame &&
    Number.isFinite(frame.zoom) &&
    frame.zoom >= 0.5 &&
    frame.zoom <= 3 &&
    Number.isFinite(frame.x) &&
    Math.abs(frame.x) <= 50 &&
    Number.isFinite(frame.y) &&
    Math.abs(frame.y) <= 50
  );
}

export const fantasyCastingLabel = 'fantasy casting';

export function isShelf(value) {
  return (
    value &&
    Number.isInteger(value.rowCount) &&
    value.rowCount >= 1 &&
    value.rowCount <= maxShelfRows &&
    Number.isInteger(value.slotsPerRow) &&
    value.slotsPerRow >= 1 &&
    value.slotsPerRow <= maxShelfSlots &&
    (value.placement === undefined ||
      (Array.isArray(value.placement) &&
        value.placement.every(
          (id) => id === null || (typeof id === 'string' && id.length > 0),
        ) &&
        new Set(value.placement.filter((id) => id !== null)).size ===
          value.placement.filter((id) => id !== null).length))
  );
}

export function isCar(car) {
  return (
    car &&
    typeof car.id === 'string' &&
    car.id.length > 0 &&
    typeof car.brand === 'string' &&
    typeof car.model === 'string' &&
    (car.year == null || Number.isInteger(car.year)) &&
    (car.color === undefined || Object.hasOwn(paintColors, car.color)) &&
    ['series', 'releaseColor', 'toyNumber', 'catalogTitle'].every(
      (key) => car[key] == null || typeof car[key] === 'string',
    ) &&
    (car.releaseYear == null || Number.isInteger(car.releaseYear)) &&
    (car.photoFrame === undefined || isPhotoFrame(car.photoFrame))
  );
}

export function compareCarYears(a, b) {
  return (
    (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER)
  );
}

export function arrangeCars(cars, placement) {
  const ordered = [...cars].sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      compareCarYears(a, b) ||
      a.model.localeCompare(b.model),
  );
  if (!placement) return ordered;

  const carsById = new Map(cars.map((car) => [car.id, car]));
  const placed = new Set(placement);
  const unplaced = ordered.filter((car) => !placed.has(car.id));
  let next = 0;
  const slots = placement.map(
    (id) => carsById.get(id) ?? unplaced[next++] ?? null,
  );
  return [...slots, ...unplaced.slice(next)];
}
