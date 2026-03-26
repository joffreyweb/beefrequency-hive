export async function getCoordinates(city: string, country: string): Promise<{ lat: number; lng: number }> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "BeeFrequency-Hive/1.0" },
  });
  const data = await res.json();
  if (!data[0]) throw new Error(`City not found: ${city}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
