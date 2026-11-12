export const collectionApi = '/api/pit-lane';

export async function requestCollection(
  endpoint,
  { method = 'GET', body, signal } = {},
) {
  const response = await fetch(`${collectionApi}/${endpoint}`, {
    method,
    signal,
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(error ?? 'The collection server did not respond.');
  }
  return response.json();
}

export async function resizePhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error(
        'This photo could not be opened. Try a JPEG, PNG, or WebP file.',
      );
    }
    const scale = Math.min(
      1,
      1200 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/webp', 0.85);
    const prefix = 'data:image/webp;base64,';
    if (!data.startsWith(prefix))
      throw new Error('This browser could not encode a WebP photo.');
    return data.slice(prefix.length);
  } finally {
    URL.revokeObjectURL(url);
  }
}
