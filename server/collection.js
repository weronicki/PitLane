import { createReadStream, mkdirSync } from 'node:fs';
import { mkdtemp, rmdir, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { backup, DatabaseSync } from 'node:sqlite';
import {
  arrangeCars,
  defaultShelf,
  isCar,
  isShelf,
} from '../src/collection.js';

const api = '/api/pit-lane';
const maxPhotoBytes = 2 * 1024 * 1024;
const maxBodyBytes = 4 * 1024 * 1024;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
    throw new RequestError(415, 'Expected JSON.');
  }

  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) tooLarge = true;
    if (!tooLarge) chunks.push(chunk);
  }
  if (tooLarge) throw new RequestError(413, 'The upload is too large.');
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Invalid JSON.');
  }
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(data));
}

function decodePhoto(encoded) {
  if (
    typeof encoded !== 'string' ||
    encoded.length > Math.ceil(maxPhotoBytes / 3) * 4
  ) {
    throw new RequestError(400, 'The resized photo is too large.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (
    bytes.length < 16 ||
    bytes.length > maxPhotoBytes ||
    bytes.toString('ascii', 0, 4) !== 'RIFF' ||
    bytes.toString('ascii', 8, 12) !== 'WEBP' ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  ) {
    throw new RequestError(400, 'Invalid WebP photo.');
  }
  return bytes;
}

export function collectionMiddleware(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      details TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS car_photos (
      car_id TEXT PRIMARY KEY REFERENCES cars(id) ON DELETE CASCADE,
      webp BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const shelfSetting = db.prepare(
    "SELECT value FROM settings WHERE key = 'shelf'",
  );
  const saveShelf = db.prepare(
    "INSERT OR REPLACE INTO settings VALUES ('shelf', ?)",
  );
  const listCars = db.prepare(`
    SELECT details, EXISTS (SELECT 1 FROM car_photos WHERE car_id = cars.id) AS hasPhoto
    FROM cars ORDER BY rowid
  `);
  const saveCar = db.prepare(
    'INSERT INTO cars VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET details = excluded.details',
  );
  const findCar = db.prepare('SELECT 1 FROM cars WHERE id = ?');
  const removeCar = db.prepare('DELETE FROM cars WHERE id = ?');
  const getPhoto = db.prepare('SELECT webp FROM car_photos WHERE car_id = ?');
  const hasPhoto = db.prepare('SELECT 1 FROM car_photos WHERE car_id = ?');
  const savePhoto = db.prepare(
    'INSERT OR REPLACE INTO car_photos VALUES (?, ?)',
  );
  const deletePhoto = db.prepare('DELETE FROM car_photos WHERE car_id = ?');

  function transaction(write) {
    db.exec('BEGIN IMMEDIATE');
    try {
      write();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function readCollection() {
    const shelf = shelfSetting.get();
    return {
      initialized: Boolean(shelf),
      shelf: shelf ? JSON.parse(shelf.value) : defaultShelf,
      cars: listCars.all().map(({ details, hasPhoto }) => ({
        ...JSON.parse(details),
        hasPhoto: Boolean(hasPhoto),
      })),
    };
  }

  function writeCar(car) {
    const { hasPhoto, ...details } = car;
    saveCar.run(details.id, JSON.stringify(details));
  }

  async function sendBackup(response) {
    const directory = await mkdtemp(join(tmpdir(), 'pit-lane-backup-'));
    const snapshot = join(directory, 'collection.sqlite');
    try {
      await backup(db, snapshot);
      const { size } = await stat(snapshot);
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="collection.sqlite"',
        'Content-Length': size,
      });
      await pipeline(createReadStream(snapshot), response);
    } finally {
      await unlink(snapshot).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
      await rmdir(directory);
    }
  }

  async function route(request, response, pathname) {
    const method = request.method;
    const origin = request.headers.origin;
    if (
      origin &&
      origin !== `http://${request.headers.host}` &&
      origin !== `https://${request.headers.host}`
    ) {
      throw new RequestError(403, 'Open Pit Lane from its own address.');
    }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    if (method === 'GET' && pathname === `${api}/collection`) {
      return sendJson(response, readCollection());
    }
    if (method === 'POST' && pathname === `${api}/initialize`) {
      const { cars } = (await readJson(request)) ?? {};
      if (
        !Array.isArray(cars) ||
        !cars.every(isCar) ||
        new Set(cars.map((car) => car.id)).size !== cars.length
      ) {
        throw new RequestError(
          400,
          'The browser collection could not be migrated.',
        );
      }
      transaction(() => {
        if (shelfSetting.get()) return;
        cars.forEach(writeCar);
        saveShelf.run(JSON.stringify(defaultShelf));
      });
      return sendJson(response, readCollection());
    }
    if (method === 'PUT' && pathname === `${api}/car`) {
      const { car, photo } = (await readJson(request)) ?? {};
      if (!isCar(car)) throw new RequestError(400, 'Invalid car details.');
      const photoBytes = photo == null ? null : decodePhoto(photo);
      let shelf;
      transaction(() => {
        if (!findCar.get(car.id)) {
          const current = readCollection();
          const slots = arrangeCars(current.cars, current.shelf.placement);
          const capacity = current.shelf.rowCount * current.shelf.slotsPerRow;
          const placement = Array.from(
            { length: Math.max(capacity, slots.length) },
            (_, index) => slots[index]?.id ?? null,
          );
          placement.push(car.id);
          shelf = { ...current.shelf, placement };
          saveShelf.run(JSON.stringify(shelf));
        }
        writeCar(car);
        if (photo === null) deletePhoto.run(car.id);
        if (photoBytes) savePhoto.run(car.id, photoBytes);
      });
      return sendJson(response, {
        ...car,
        hasPhoto: Boolean(hasPhoto.get(car.id)),
        shelf,
      });
    }
    if (method === 'DELETE' && pathname === `${api}/car`) {
      const { id } = (await readJson(request)) ?? {};
      if (typeof id !== 'string' || !id)
        throw new RequestError(400, 'Invalid car ID.');
      transaction(() => {
        removeCar.run(id);
        const stored = shelfSetting.get();
        if (!stored) return;
        const shelf = JSON.parse(stored.value);
        if (shelf.placement?.includes(id)) {
          shelf.placement = shelf.placement.map((slot) =>
            slot === id ? null : slot,
          );
          saveShelf.run(JSON.stringify(shelf));
        }
      });
      return sendJson(response, readCollection());
    }
    if (method === 'PUT' && pathname === `${api}/shelf`) {
      const shelf = await readJson(request);
      if (!isShelf(shelf))
        throw new RequestError(400, 'Invalid shelf dimensions.');
      const { rowCount, slotsPerRow, placement } = shelf;
      const settings = { rowCount, slotsPerRow, placement };
      saveShelf.run(JSON.stringify(settings));
      return sendJson(response, settings);
    }
    if (method === 'GET' && pathname.startsWith(`${api}/photo/`)) {
      const id = decodeURIComponent(pathname.slice(`${api}/photo/`.length));
      const photo = getPhoto.get(id);
      if (!photo) throw new RequestError(404, 'No photo for this car.');
      response.writeHead(200, { 'Content-Type': 'image/webp' });
      return response.end(photo.webp);
    }
    if (method === 'GET' && pathname === `${api}/backup.sqlite`)
      return sendBackup(response);
    if (method === 'GET' && pathname === `${api}/collection.json`) {
      const { cars, shelf } = readCollection();
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="collection.json"',
      );
      return sendJson(response, {
        cars: cars.map(({ hasPhoto, ...car }) => car),
        shelf,
      });
    }
    throw new RequestError(404, 'Unknown collection endpoint.');
  }

  return {
    handle(request, response, next) {
      const pathname = request.url.split('?')[0];
      if (!pathname.startsWith(`${api}/`)) return next();
      route(request, response, pathname).catch((error) => {
        if (!(error instanceof RequestError)) console.error(error);
        if (response.headersSent) return response.destroy();
        sendJson(
          response,
          {
            error: error.status
              ? error.message
              : 'The collection could not be accessed.',
          },
          error.status ?? 500,
        );
      });
    },
    close: () => db.close(),
  };
}
