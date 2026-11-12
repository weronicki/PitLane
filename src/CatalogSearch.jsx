import React, { useEffect, useRef, useState } from 'react';
import { catalogPageUrl, loadReleases, searchCatalog } from './catalog.js';

export default function CatalogSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [casting, setCasting] = useState(null);
  const [releases, setReleases] = useState([]);
  const [status, setStatus] = useState('idle');
  const pendingRequest = useRef(null);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  async function runRequest(load, onSuccess, errorStatus) {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setStatus('loading');

    try {
      const data = await load(controller.signal);
      if (controller.signal.aborted) return;
      onSuccess(data);
      setStatus(data.length ? 'ready' : 'empty');
    } catch {
      if (!controller.signal.aborted) setStatus(errorStatus);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setCasting(null);
    setResults([]);
    runRequest(
      (signal) => searchCatalog(term, signal),
      setResults,
      'search-error',
    );
  }

  function showReleases(page) {
    setCasting(page);
    setReleases([]);
    runRequest(
      (signal) => loadReleases(page.pageid, signal),
      setReleases,
      'release-error',
    );
  }

  function backToResults() {
    pendingRequest.current?.abort();
    setCasting(null);
    setStatus('ready');
  }

  return (
    <section
      className="editor catalog"
      id="catalog-search"
      aria-labelledby="catalog-title"
    >
      <h3 id="catalog-title">Search Hot Wheels Wiki</h3>
      <form className="catalog-query" onSubmit={handleSearch}>
        <label htmlFor="catalog-query">Model or casting name</label>
        <input
          id="catalog-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Skyline R34"
          maxLength={100}
          required
          autoFocus
        />
        <button
          className="primary-button"
          type="submit"
          disabled={!query.trim()}
        >
          Search
        </button>
      </form>

      {casting && (
        <div className="catalog-detail">
          <button
            type="button"
            className="secondary-button"
            onClick={backToResults}
          >
            Back to results
          </button>
          <h4>{casting.title}</h4>
          <a
            href={catalogPageUrl(casting.title)}
            target="_blank"
            rel="noreferrer"
          >
            View on Hot Wheels Wiki ↗
          </a>
        </div>
      )}

      {status === 'loading' && (
        <p className="catalog-message" role="status">
          {casting ? 'Loading releases…' : 'Searching the catalog…'}
        </p>
      )}
      {status === 'empty' && (
        <p className="catalog-message" role="status">
          {casting
            ? 'No release rows found. You can use the casting name and enter the details yourself.'
            : 'No matches. Try a shorter model name.'}
        </p>
      )}
      {status === 'search-error' && (
        <p className="catalog-message" role="alert">
          The catalog search failed. Check your connection and try Search again.
        </p>
      )}
      {status === 'release-error' && (
        <p className="catalog-message" role="alert">
          Couldn’t load the releases.{' '}
          <button
            type="button"
            className="text-button"
            onClick={() => showReleases(casting)}
          >
            Retry
          </button>
        </p>
      )}

      {!casting && status === 'ready' && (
        <ul className="catalog-list" aria-label="Matching castings">
          {results.map((page) => (
            <li key={page.pageid}>
              <strong>{page.title}</strong>
              <button
                type="button"
                className="secondary-button"
                onClick={() => showReleases(page)}
                aria-label={`View releases for ${page.title}`}
              >
                View releases
              </button>
            </li>
          ))}
        </ul>
      )}
      {casting && status === 'ready' && (
        <ul className="catalog-list" aria-label="Hot Wheels releases">
          {releases.map((release, index) => (
            <li key={JSON.stringify(release)}>
              <div>
                <strong>
                  {[release.releaseYear, release.series, release.releaseColor]
                    .filter(Boolean)
                    .join(' · ')}
                </strong>
                {release.toyNumber && <small>Toy # {release.toyNumber}</small>}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onSelect(casting, release, index)}
              >
                Use release
              </button>
            </li>
          ))}
        </ul>
      )}
      {casting && (status === 'empty' || status === 'release-error') && (
        <button
          type="button"
          className="secondary-button"
          onClick={() => onSelect(casting, {}, 'casting')}
        >
          Use casting name
        </button>
      )}
    </section>
  );
}
