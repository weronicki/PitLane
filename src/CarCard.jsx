import React, { useId, useState } from 'react';
import { photoTransform } from './PhotoFraming.jsx';
import { collectionApi } from './collectionApi.js';
import { catalogPageUrl } from './catalog.js';
import { getCarPaint } from './cars.js';
import { fantasyCastingLabel } from './collection.js';

const coupeBody =
  'M10 40 53 28 123 17 165 12Q208 5 242 13 275 19 316 40l39 13q28-6 55 3 34 12 56 43l-5 11 7 21-23 4H56L34 119l-23-19-7-15 10-9 1-27z';

export default function CarCard({
  car,
  photoVersion = 0,
  disabled,
  onEdit,
  onFindOnShelf,
}) {
  const paint = getCarPaint(car);
  const gradientId = useId();
  const bodyLight = gradientId + '-body';
  const glassLight = gradientId + '-glass';
  const photoUrl = `${collectionApi}/photo/${encodeURIComponent(car.id)}?v=${photoVersion}`;
  const [failedPhoto, setFailedPhoto] = useState(null);
  const showPhoto = car.hasPhoto && failedPhoto !== photoUrl;
  const releaseDetails = [
    car.releaseYear && `${car.releaseYear} Hot Wheels`,
    car.series,
    car.releaseColor,
    car.toyNumber && `Toy # ${car.toyNumber}`,
  ].filter(Boolean);

  return (
    <article className="car-card">
      <div
        className={showPhoto ? 'car-art has-photo' : 'car-art'}
        style={{ '--paint': paint }}
      >
        {car.year != null && (
          <span className="art-year" aria-hidden="true">
            {car.year}
          </span>
        )}
        <svg viewBox="0 0 280 112" aria-hidden="true">
          <defs>
            <linearGradient id={bodyLight} x2="0" y2="1">
              <stop stopColor="#fff" stopOpacity=".27" />
              <stop offset=".45" stopColor="#fff" stopOpacity=".05" />
              <stop offset=".58" stopColor="#12141c" stopOpacity=".05" />
              <stop offset="1" stopColor="#12141c" stopOpacity=".49" />
            </linearGradient>
            <linearGradient id={glassLight} x2="0" y2="1">
              <stop stopColor="#5c687e" />
              <stop offset=".48" stopColor="#343e50" />
              <stop offset="1" stopColor="#171e2a" />
            </linearGradient>
          </defs>

          <g
            transform="translate(5 14) scale(.57)"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ellipse
              cx="239"
              cy="140"
              rx="226"
              ry="10"
              fill="#08090d"
              opacity=".82"
            />

            {/* Main shell and the reflections that define its front and rear shoulders. */}
            <path
              d={coupeBody}
              fill={paint}
              stroke="#0d121a"
              strokeWidth="2.5"
            />
            <path d={coupeBody} fill={`url(#${bodyLight})`} />
            <path
              d="M11 40 54 29l72-11 41-5q43-6 75 1 38 9 76 29l37 11q29-5 55 3 34 12 53 39"
              fill="none"
              stroke="#fff"
              strokeOpacity=".52"
              strokeWidth="2"
            />
            <path
              d="M14 42 49 35q34-8 66 0l51 14-17 13-21-1q-26-20-56-13-25 4-40 27l-15 1z"
              fill="#fff"
              opacity=".17"
            />
            <path
              d="M33 42q42-18 79-7l38 10"
              fill="none"
              stroke="#edf3ff"
              strokeOpacity=".43"
              strokeWidth="2"
            />
            <path
              d="M13 49l18 5-3 8-13-5z"
              fill="#db635f"
              stroke="#18202a"
              strokeWidth="1.5"
            />
            <path
              d="M15 59l13 6-4 18-11-5zM9 87l24 9-4 14-16-11zM29 111l23 8-1 14-17-10z"
              fill="#131a24"
            />

            {/* Low teardrop glass and the slim roof surround. */}
            <path
              d="M127 27q28-13 64-14 34-1 58 6 41 12 80 38l-34 5-50-1-52-10z"
              fill={`url(#${glassLight})`}
              stroke="#10151d"
              strokeWidth="2.3"
            />
            <path
              d="M129 27q34-13 63-13 33-1 57 6 38 11 75 34"
              fill="none"
              stroke="#e7efff"
              strokeOpacity=".64"
              strokeWidth="2.1"
            />
            <path d="m168 18 3 27 5 2-2-31z" fill="#11171f" />
            <path
              d="M181 22q41-7 66 0 30 8 57 27l-54-10-64-4z"
              fill="#fff"
              opacity=".08"
            />
            <path
              d="M294 56q2-8 14-7l12 4-1 5-10 5-13-2z"
              fill={paint}
              stroke="#15202b"
              strokeWidth="2"
            />
            <path
              d="M298 53q9-4 18 0"
              fill="none"
              stroke="#fff"
              strokeOpacity=".52"
              strokeWidth="1.5"
            />

            {/* The triangular intake and layered crease that runs into the rocker. */}
            <path
              d="M153 58 185 42l60 17 51 5 34-3-16 36-56 26-59-10-27-25z"
              fill="#fff"
              opacity=".12"
            />
            <path
              d="M150 61 186 42q-13 15-4 31l18 28 34 22-26-1-38-25z"
              fill="#17212d"
              stroke="#16212d"
              strokeWidth="2"
            />
            <path
              d="M154 63 173 52q-5 10 2 22l19 27 24 17-14-2-30-22z"
              fill="#0c131c"
            />
            <path
              d="M188 43q-12 16-2 33l17 26 34 21 34-9 39-18 17-34"
              fill="none"
              stroke="#111c28"
              strokeOpacity=".82"
              strokeWidth="1.9"
            />
            <path
              d="M188 47q24 15 58 22l48 3m-98-8 15 4"
              fill="none"
              stroke="#edf4ff"
              strokeOpacity=".42"
              strokeWidth="1.8"
            />
            <path
              d="m191 64 13 4"
              fill="none"
              stroke="#273342"
              strokeWidth="2.4"
            />
            <path
              d="M124 133l21-29 62 17 30 3 36-10 45-15-5 29-35 7H119z"
              fill="#142335"
              opacity=".46"
            />
            <path
              d="m130 132 28-19 50 9 29 2 36-10 42-13-14 17-68 14z"
              fill="#fff"
              opacity=".23"
            />
            <path
              d="M126 134h187m-180-5 33-16 43 9"
              fill="none"
              stroke="#182431"
              strokeWidth="2"
            />

            {/* Blade headlamp and the forward bumper openings. */}
            <path
              d="M406 58q23 7 46 29l-19-7-18-11z"
              fill="#c8e0f5"
              stroke="#16212d"
              strokeWidth="1.8"
            />
            <path
              d="M413 62q17 6 29 18l-12-5"
              fill="none"
              stroke="#f3f9ff"
              strokeWidth="2.2"
            />
            <path
              d="m445 100 18 3-4 15 5 10-28-2z"
              fill="#13202c"
              stroke="#101720"
              strokeWidth="1.7"
            />
            <path d="m449 103-8 17 17 3-3-7 4-12z" fill="#080d15" />
            <path d="M415 126l22 3 26 2-4 3h-45z" fill="#18232f" />
            <path
              d="M36 103a51 51 0 0 1 103 0m177 0a51 51 0 0 1 102 0"
              fill="none"
              stroke="#10151e"
              strokeOpacity=".72"
              strokeWidth="2.5"
            />

            {[90, 367].map((x) => (
              <g key={x} transform={`translate(${x} 104)`}>
                <circle
                  r="44"
                  fill="#0f1218"
                  stroke="#080b10"
                  strokeWidth="2.7"
                />
                <circle
                  r="39.5"
                  fill="none"
                  stroke="#3b414a"
                  strokeWidth="1.2"
                />
                <circle
                  r="34.5"
                  fill="#88919e"
                  stroke="#bec8d3"
                  strokeWidth="2.4"
                />
                <circle r="31" fill="#222932" />
                <circle
                  r="25"
                  fill="#424a54"
                  stroke="#737b85"
                  strokeWidth="1.4"
                />
                {[0, 72, 144, 216, 288].map((angle) => (
                  <path
                    key={angle}
                    transform={`rotate(${angle})`}
                    d="M-3.8-5-7-28-1-31 3-27 4-5z"
                    fill="#b5beca"
                    stroke="#7c8794"
                    strokeWidth=".7"
                  />
                ))}
                <circle
                  r="8"
                  fill="#535f6e"
                  stroke="#c4ced9"
                  strokeWidth="1.6"
                />
                <circle r="3" fill="#aeb8c5" />
              </g>
            ))}
          </g>
        </svg>
        {showPhoto && (
          <img
            key={photoUrl}
            className="car-photo"
            style={{ transform: photoTransform(car.photoFrame) }}
            src={photoUrl}
            alt={`${car.brand} ${car.model} die-cast car`}
            loading="lazy"
            onError={() => setFailedPhoto(photoUrl)}
          />
        )}
      </div>
      <div className="car-info">
        <span className="car-brand">{car.brand}</span>
        <h3>{car.model}</h3>
        {releaseDetails.length > 0 && (
          <p className="release-summary">{releaseDetails.join(' · ')}</p>
        )}
        {typeof car.catalogTitle === 'string' && (
          <a
            className="catalog-source"
            href={catalogPageUrl(car.catalogTitle)}
            target="_blank"
            rel="noreferrer"
          >
            Hot Wheels Wiki ↗
          </a>
        )}
        <div className="car-footer">
          <span className="car-year">{car.year ?? fantasyCastingLabel}</span>
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={onFindOnShelf}
            aria-label={`Find ${car.brand} ${car.model} on shelf`}
          >
            Find on shelf
          </button>
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={onEdit}
            aria-label={`Edit ${car.brand} ${car.model}`}
          >
            Edit <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </article>
  );
}
