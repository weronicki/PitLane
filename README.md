# Pit Lane

Pit Lane is a local Hot Wheels collection manager built with React, Vite, and SQLite. Catalog your cars, add photos, and map your collection to a display shelf.

## Features

- Search your collection and filter it by brand or real-car year.
- Look up castings and release details on the Hot Wheels Wiki.
- Add and frame a photo for each car.
- Arrange cars on a drag-and-drop shelf, move them to a tray, and locate them from their cards.
- View collection statistics and switch between light and dark themes.

## Getting started

Use Node.js **22.16 or later in the 22.x series**, or **24 or later**.

```sh
git clone https://github.com/weronicki/PitLane.git
cd PitLane
npm ci
npm run dev
```

Open the URL Vite prints, usually [http://localhost:5173](http://localhost:5173).

## Commands

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the development server and collection API   |
| `npm run build`        | Build the frontend into `dist/`                   |
| `npm run preview`      | Preview the build locally with the collection API |
| `npm run format`       | Format the source files                           |
| `npm run format:check` | Check source formatting                           |

## Data and backups

Pit Lane creates `data/collection.sqlite` on first run. It stores your cars, photos, and shelf layout. Git ignores the `data/` directory. Use the in-app SQLite backup to keep a copy of the full collection or the JSON export for car details and shelf settings.

The app needs the Node.js collection API at runtime. See the guide for how the server fits together.

## Documentation

The [architecture and code guide](docs/ARCHITECTURE.md) walks through the React components, data flow, SQLite API, and shelf logic. It includes the original code review, learning exercises, and source appendix.
