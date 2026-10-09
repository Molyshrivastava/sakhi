// Small helpers for checking and measuring GPS coordinates.

// Number("") is 0, which would silently become a real coordinate (0, 0).
// This returns NaN for empty values so they get rejected instead.
function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "string" && value.trim() === "") return NaN;
  return Number(value);
}

function isValidCoord(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Real distance between two points on Earth, in kilometres.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { toNumber, isValidCoord, haversineKm };
