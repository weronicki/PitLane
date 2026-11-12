import React, { useEffect, useState } from 'react';
import CatalogSearch from './CatalogSearch.jsx';
import CarCard from './CarCard.jsx';
import CarForm from './CarForm.jsx';
import Shelf from './Shelf.jsx';
import CollectionStatistics from './CollectionStatistics.jsx';
import { starterCars } from './cars.js';
import { compareCarYears, defaultShelf, isCar } from './collection.js';
import {
  collectionApi,
  requestCollection,
  resizePhoto,
} from './collectionApi.js';

const COLLECTION_KEY = 'pit-lane:collection:v1';

function loadCars() {
  try {
    const saved = localStorage.getItem(COLLECTION_KEY);
    if (saved === null) return starterCars;

    const cars = JSON.parse(saved);
    if (Array.isArray(cars) && cars.every(isCar)) {
      return cars;
    }
  } catch {
    // Use the sample collection if storage is blocked or unreadable.
  }
  return starterCars;
}

function matchesCarSearch(car, terms) {
  if (!terms.length) return true;
  const details = [
    car.brand,
    car.model,
    car.series,
    car.releaseColor,
    car.toyNumber,
  ]
    .join(' ')
    .toLowerCase();
  return terms.every((term) => details.includes(term));
}

function CountedFilter({
  label,
  allCount,
  counts,
  options,
  value,
  onChange,
  disabled,
}) {
  const allLabel = `All ${label.toLowerCase()}s`;
  const [open, setOpen] = useState(false);
  const trigger = React.useRef(null);

  function close() {
    setOpen(false);
    trigger.current.focus();
  }

  return (
    <div
      className="filter counted-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        ref={trigger}
        className="counted-filter-trigger"
        disabled={disabled}
        aria-expanded={open && !disabled}
        aria-label={`${label}: ${value || allLabel}`}
        onClick={() => setOpen(!open)}
      >
        {value || allLabel}{' '}
        <span className="option-count">
          ({value ? counts.get(value) : allCount})
        </span>
      </button>
      {open && !disabled && (
        <div
          className="counted-filter-options"
          role="group"
          aria-label={`${label} options`}
        >
          {['', ...options].map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={option === value}
              onClick={() => {
                onChange(option);
                close();
              }}
            >
              {option || allLabel}{' '}
              <span className="option-count">
                ({option ? counts.get(option) : allCount})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('pit-lane:theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('pit-lane:theme', theme);
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }, [darkMode]);

  const [cars, setCars] = useState([]);
  const [shelf, setShelf] = useState(defaultShelf);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [photoVersions, setPhotoVersions] = useState({});
  const [brandFilter, setBrandFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [carSearch, setCarSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [shelfLocation, setShelfLocation] = useState(null);

  useEffect(() => {
    if (!shelfLocation) return;
    const timeout = window.setTimeout(() => setShelfLocation(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [shelfLocation]);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function openCollection() {
      try {
        let data = await requestCollection('collection', {
          signal: controller.signal,
        });
        if (!data.initialized) {
          data = await requestCollection('initialize', {
            method: 'POST',
            body: { cars: loadCars() },
            signal: controller.signal,
          });
        }
        if (controller.signal.aborted) return;
        setCars(data.cars);
        setShelf(data.shelf);
        setReady(true);
      } catch {
        if (!controller.signal.aborted)
          setStorageError(
            'Could not open the collection. Start the local Pit Lane server and refresh.',
          );
      }
    }

    openCollection();
    return () => controller.abort();
  }, []);

  // Both views are calculated from the collection whenever App renders.
  const brands = [...new Set(cars.map((car) => car.brand))].sort((a, b) =>
    a.localeCompare(b),
  );
  const yearCars = cars.filter(
    (car) => !yearFilter || String(car.year) === yearFilter,
  );
  const brandCounts = new Map();
  for (const { brand } of yearCars) {
    brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
  }
  const availableBrands = brands.filter((brand) => brandCounts.has(brand));
  const brandCars = cars.filter(
    (car) => !brandFilter || car.brand === brandFilter,
  );
  const yearCounts = new Map();
  for (const { year } of brandCars) {
    if (Number.isInteger(year))
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const years = [...yearCounts.keys()].sort((a, b) => a - b);
  const searchTerms = carSearch
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const visibleCars = brandCars
    .filter(
      (car) =>
        (!yearFilter || String(car.year) === yearFilter) &&
        matchesCarSearch(car, searchTerms),
    )
    .sort((a, b) => compareCarYears(a, b) || a.model.localeCompare(b.model));

  function useCatalogRelease(casting, release, releaseIndex) {
    const title = casting.title;
    const brand =
      brands.find((name) =>
        title.toLowerCase().startsWith(name.toLowerCase() + ' '),
      ) ?? '';
    setEditor({
      car: null,
      key: `catalog-${casting.pageid}-${releaseIndex}`,
      prefill: {
        ...release,
        brand,
        model: title.slice(brand ? brand.length + 1 : 0),
        catalogTitle: casting.title,
      },
    });
    setCatalogOpen(false);
  }

  async function saveCar(draft, { photoFile, removePhoto }) {
    const brand =
      brands.find((name) => name.toLowerCase() === draft.brand.toLowerCase()) ??
      draft.brand;
    const updatedCar = {
      ...draft,
      brand,
      id: editor.car?.id ?? crypto.randomUUID(),
    };

    setSaving(true);
    setStorageError('');
    try {
      const photo = photoFile
        ? await resizePhoto(photoFile)
        : removePhoto
          ? null
          : undefined;
      const { shelf: updatedShelf, ...car } = await requestCollection('car', {
        method: 'PUT',
        body: { car: updatedCar, photo },
      });
      if (updatedShelf) setShelf(updatedShelf);
      setCars((previous) =>
        editor.car
          ? previous.map((existing) =>
              existing.id === car.id ? car : existing,
            )
          : [...previous, car],
      );
      if (photo !== undefined) {
        setPhotoVersions((previous) => ({
          ...previous,
          [car.id]: (previous[car.id] ?? 0) + 1,
        }));
      }
      // Reset dropdown filters that would hide the saved car.
      setBrandFilter((current) => (current === car.brand ? current : ''));
      setYearFilter((current) => (current === String(car.year) ? current : ''));
      setAnnouncement(
        updatedShelf
          ? `Added ${car.brand} ${car.model} to the Off-shelf tray.`
          : `Saved ${car.brand} ${car.model}.`,
      );
      setEditor(null);
    } catch (error) {
      setStorageError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCar() {
    const car = editor?.car;
    if (!car || saving) return;
    setSaving(true);
    setStorageError('');
    try {
      const data = await requestCollection('car', {
        method: 'DELETE',
        body: { id: car.id },
      });
      setCars(data.cars);
      setShelf(data.shelf);

      const keepBrand =
        !brandFilter || data.cars.some((entry) => entry.brand === brandFilter);
      if (!keepBrand) setBrandFilter('');
      if (
        yearFilter &&
        !data.cars.some(
          (entry) =>
            String(entry.year) === yearFilter &&
            (!keepBrand || !brandFilter || entry.brand === brandFilter),
        )
      ) {
        setYearFilter('');
      }

      setAnnouncement(`Removed ${car.brand} ${car.model}.`);
      setEditor(null);
    } catch (error) {
      setStorageError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeShelf(settings) {
    setSaving(true);
    setStorageError('');
    try {
      setShelf(
        await requestCollection('shelf', { method: 'PUT', body: settings }),
      );
    } catch (error) {
      setStorageError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="masthead">
        <div className="shell header-inner">
          <a href="./" className="wordmark">
            Pit Lane
          </a>
          <div className="header-actions">
            <span className="header-label">DIE-CAST COLLECTION</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setDarkMode((enabled) => !enabled)}
            >
              {darkMode ? 'White mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </header>
      <main className="shell">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">THE COLLECTOR’S GARAGE</p>
            <h1 id="page-title">My Hot Wheels</h1>
            <p className="subtitle">
              Catalog your cars and see how the real models line up by year.
            </p>
          </div>
          <dl className="stats">
            <div>
              <dt>Cars</dt>
              <dd>{cars.length}</dd>
            </div>
            <div>
              <dt>Brands</dt>
              <dd>{brands.length}</dd>
            </div>
          </dl>
        </section>
        <section className="collection" aria-labelledby="collection-title">
          <div className="collection-top">
            <div>
              <h2 id="collection-title">Collection</h2>
              <p className="count" aria-live="polite">
                Showing {visibleCars.length} of {cars.length} cars · Oldest
                first
              </p>
            </div>
            <div className="toolbar">
              <label className="filter collection-search">
                Search my cars
                <input
                  type="search"
                  value={carSearch}
                  onChange={(event) => setCarSearch(event.target.value)}
                  placeholder="Model, series, color, toy #"
                />
              </label>
              <CountedFilter
                label="Brand"
                allCount={yearCars.length}
                counts={brandCounts}
                options={availableBrands}
                value={brandFilter}
                onChange={setBrandFilter}
                disabled={saving}
              />
              <CountedFilter
                label="Year"
                allCount={brandCars.length}
                counts={yearCounts}
                options={years}
                value={yearFilter ? Number(yearFilter) : ''}
                onChange={(year) => setYearFilter(String(year))}
                disabled={saving}
              />
              <button
                type="button"
                className="secondary-button"
                disabled={!ready}
                aria-expanded={statisticsOpen}
                aria-controls={
                  statisticsOpen ? 'collection-statistics' : undefined
                }
                onClick={() => setStatisticsOpen((open) => !open)}
              >
                Statistics
              </button>
              <button
                type="button"
                className="secondary-button"
                aria-expanded={shelfOpen}
                aria-controls="display-shelf"
                onClick={() => {
                  setShelfLocation(null);
                  setShelfOpen((open) => !open);
                }}
              >
                {shelfOpen ? 'Hide shelf' : 'Show shelf'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!ready || saving}
                aria-expanded={catalogOpen}
                aria-controls={catalogOpen ? 'catalog-search' : undefined}
                onClick={() => setCatalogOpen((open) => !open)}
              >
                {catalogOpen ? 'Close catalog' : 'Search catalog'}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!ready || saving}
                onClick={() => {
                  setStorageError('');
                  setCatalogOpen(false);
                  setEditor({ car: null });
                }}
              >
                <span aria-hidden="true">+</span> Add car
              </button>
            </div>
          </div>
          {catalogOpen && <CatalogSearch onSelect={useCatalogRelease} />}
          {editor && (
            <CarForm
              key={editor.car?.id ?? editor.key ?? 'new'}
              car={editor.car}
              prefill={editor.prefill}
              saving={saving}
              saveError={storageError}
              onSave={saveCar}
              onRemove={removeCar}
              onCancel={() => {
                setStorageError('');
                setEditor(null);
              }}
            />
          )}
          <p className="sr-only" role="status">
            {announcement}
          </p>
          {statisticsOpen && <CollectionStatistics cars={cars} />}
          <Shelf
            cars={cars}
            photoVersions={photoVersions}
            hidden={!shelfOpen}
            locationRequest={shelfLocation}
            settings={shelf}
            disabled={!ready || saving}
            onChange={changeShelf}
          />
          {ready && cars.length > 0 && visibleCars.length === 0 && (
            <div className="collection-empty">
              <p>No cars match your current filters.</p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setCarSearch('');
                  setBrandFilter('');
                  setYearFilter('');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="car-grid">
            {visibleCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                photoVersion={photoVersions[car.id]}
                disabled={saving}
                onFindOnShelf={() => {
                  setShelfOpen(true);
                  setShelfLocation({ carId: car.id });
                }}
                onEdit={() => {
                  setStorageError('');
                  setEditor({ car });
                }}
              />
            ))}
          </div>
          {storageError && !editor && (
            <p className="form-error" role="alert">
              {storageError}
            </p>
          )}
          <p className="collection-note" role="status">
            {ready
              ? 'Collection saved in SQLite on this computer.'
              : storageError
                ? ''
                : 'Opening collection…'}
          </p>
          {ready && (
            <div className="collection-exports">
              <a href={`${collectionApi}/backup.sqlite`}>
                Download SQLite backup
              </a>
              <a href={`${collectionApi}/collection.json`}>
                Export JSON (car details and shelf)
              </a>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
