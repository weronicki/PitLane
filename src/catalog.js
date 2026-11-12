const API_URL = 'https://hotwheels.fandom.com/api.php';

export function catalogPageUrl(title) {
  return `https://hotwheels.fandom.com/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

async function requestCatalog(params, signal) {
  const query = new URLSearchParams({
    ...params,
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const response = await fetch(`${API_URL}?${query}`, { signal });
  if (!response.ok) throw new Error('Catalog request failed.');
  const data = await response.json();
  if (data.error) throw new Error('Catalog returned an error.');
  return data;
}

export async function searchCatalog(query, signal) {
  const data = await requestCatalog(
    {
      action: 'query',
      list: 'search',
      srsearch: query,
      srnamespace: '0',
      srlimit: '10',
      srprop: '',
    },
    signal,
  );
  return data.query.search.filter(
    (page) => Number.isInteger(page.pageid) && typeof page.title === 'string',
  );
}

function cellText(cell) {
  return cell?.textContent.replace(/\s+/g, ' ').trim() ?? '';
}

// Wiki tables merge repeated values across rows. Expand those cells so a
// release's year, series, color, and toy number stay in the correct columns.
function expandRows(table) {
  const rows = [];
  for (const [rowIndex, row] of Array.from(table.rows).entries()) {
    const cells = (rows[rowIndex] ??= []);
    let column = 0;
    for (const cell of row.cells) {
      while (cells[column]) column++;
      for (let offset = 0; offset < cell.rowSpan; offset++) {
        const target = (rows[rowIndex + offset] ??= []);
        for (let width = 0; width < cell.colSpan; width++)
          target[column + width] = cell;
      }
      column += cell.colSpan;
    }
  }
  return rows;
}

function readReleases(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const breakElement of template.content.querySelectorAll('br'))
    breakElement.replaceWith(' ');
  const releases = [];
  for (const table of template.content.querySelectorAll('table')) {
    const rows = expandRows(table);
    const headings = rows[0]?.map((cell) => cellText(cell).toLowerCase()) ?? [];
    const year = headings.indexOf('year');
    const series = headings.indexOf('series');
    const color = headings.findIndex(
      (label) => label === 'color' || label === 'colour',
    );
    const number = headings.findIndex((label) =>
      /^(toy|product)\s*(#|number|no\.?)$/.test(label),
    );
    if (year < 0 || (color < 0 && series < 0 && number < 0)) continue;

    for (const row of rows.slice(1)) {
      const yearText = cellText(row[year]);
      if (
        !/^\d{4}$/.test(yearText) ||
        Number(yearText) < 1968 ||
        Number(yearText) > 2100
      )
        continue;
      releases.push({
        releaseYear: Number(yearText),
        series: cellText(row[series]),
        releaseColor: cellText(row[color]),
        toyNumber: cellText(row[number]),
      });
    }
  }
  const unique = new Map(
    releases.map((release) => [JSON.stringify(release), release]),
  );
  return [...unique.values()].sort((a, b) => b.releaseYear - a.releaseYear);
}

export async function loadReleases(pageId, signal) {
  const data = await requestCatalog(
    {
      action: 'parse',
      pageid: String(pageId),
      prop: 'text',
      disableeditsection: '1',
    },
    signal,
  );
  if (typeof data.parse?.text !== 'string')
    throw new Error('Catalog page has no content.');
  return readReleases(data.parse.text);
}
