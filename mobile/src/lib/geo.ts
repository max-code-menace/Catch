export type Point = { lat: number; lng: number };

// Distance à vol d'oiseau, en kilomètres.
export function distanceKm(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// « à 600 m », « à 3 km »
export function texteDistance(km: number) {
  if (km < 1) return `à ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `à ${Math.round(km)} km`;
}

// Portion de carte qui montre un cercle de ce rayon autour du centre.
export function regionAutour(centre: Point, rayonKm: number) {
  const latitudeDelta = (rayonKm * 2 * 1.5) / 111;
  return {
    latitude: centre.lat,
    longitude: centre.lng,
    latitudeDelta,
    longitudeDelta: latitudeDelta / Math.cos((centre.lat * Math.PI) / 180),
  };
}
