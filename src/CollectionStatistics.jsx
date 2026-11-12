import React from 'react';

function countBy(cars, getLabel) {
  const counts = new Map();
  for (const car of cars) {
    const label = getLabel(car);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()];
}

function mostFirst(a, b) {
  return b[1] - a[1] || a[0].localeCompare(b[0]);
}

function Breakdown({ title, entries, emptyMessage }) {
  const max = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <section className="stats-breakdown">
      <h4>{title}</h4>
      {entries.length ? (
        <ul className="stats-bars">
          {entries.map(([label, count]) => (
            <li key={label}>
              <div className="stats-bar-label">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
              <div className="stats-track" aria-hidden="true">
                <div
                  className="stats-fill"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="catalog-message">{emptyMessage}</p>
      )}
    </section>
  );
}

export default function CollectionStatistics({ cars }) {
  const dated = cars.filter((car) => car.year != null);
  const brands = countBy(cars, (car) => car.brand).sort(mostFirst);
  const decades = countBy(
    dated,
    (car) => `${Math.floor(car.year / 10) * 10}s`,
  ).sort(([a], [b]) => a.localeCompare(b));
  const series = countBy(
    cars,
    (car) =>
      car.series?.trim().replace(/\s+\d+\/\d+$/, '') || 'No series recorded',
  ).sort(mostFirst);
  const colorLabels = new Map();
  const colors = countBy(cars, (car) => {
    const label =
      car.releaseColor?.trim() || car.color?.trim() || 'No color recorded';
    const key = label.toLowerCase();
    if (!colorLabels.has(key)) {
      colorLabels.set(key, label[0].toUpperCase() + label.slice(1));
    }
    return colorLabels.get(key);
  }).sort(mostFirst);

  return (
    <section
      className="collection-stats"
      id="collection-statistics"
      aria-labelledby="collection-statistics-title"
    >
      <div className="stats-header">
        <div>
          <h3 id="collection-statistics-title">Collection statistics</h3>
          <p className="catalog-message">Based on your full collection.</p>
        </div>
        <dl className="stats">
          <div>
            <dt>Fantasy castings</dt>
            <dd>{cars.length - dated.length}</dd>
          </div>
        </dl>
      </div>
      {cars.length ? (
        <div className="stats-grid">
          <Breakdown title="Brands" entries={brands} />
          <Breakdown
            title="Real-car decades"
            entries={decades}
            emptyMessage="No real-car years recorded."
          />
          <Breakdown title="Hot Wheels series" entries={series} />
          <Breakdown title="Colors" entries={colors} />
        </div>
      ) : (
        <p className="catalog-message">
          Add a car to see your collection breakdown.
        </p>
      )}
    </section>
  );
}
