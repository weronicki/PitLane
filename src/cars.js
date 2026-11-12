export const starterCars = [
  {
    id: 'skyline',
    brand: 'Nissan',
    model: 'Skyline GT-R (R32)',
    year: 1989,
    color: 'silver',
  },
  { id: 'rx7', brand: 'Mazda', model: 'RX-7 (FD)', year: 1992, color: 'red' },
  {
    id: 'supra',
    brand: 'Toyota',
    model: 'Supra (A80)',
    year: 1993,
    color: 'yellow',
  },
  {
    id: 'r34',
    brand: 'Nissan',
    model: 'Skyline GT-R (R34)',
    year: 1999,
    color: 'blue',
  },
  {
    id: 'mustang',
    brand: 'Ford',
    model: 'Mustang GT',
    year: 1965,
    color: 'green',
  },
  {
    id: 'porsche',
    brand: 'Porsche',
    model: '911 Turbo (930)',
    year: 1975,
    color: 'purple',
  },
];

export const paintColors = {
  silver: '#b6bfcb',
  red: '#ef5f49',
  yellow: '#ffc649',
  blue: '#689eff',
  green: '#79b591',
  purple: '#af94e8',
  orange: '#f48a40',
  white: '#f2f1ea',
  black: '#454950',
  gray: '#9098a3',
  pink: '#e58aaa',
  brown: '#a37555',
  gold: '#d4a94e',
};

export function getCarPaint(car) {
  const releaseWords =
    car.releaseColor
      ?.toLowerCase()
      .replace(/\bgrey\b/g, 'gray')
      .split(/[^a-z]+/) ?? [];
  const releasePaint = releaseWords.find((word) =>
    Object.hasOwn(paintColors, word),
  );
  if (releasePaint) return paintColors[releasePaint];
  if (Object.hasOwn(paintColors, car.color)) return paintColors[car.color];
  return paintColors.silver;
}
