import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";
import toast from "react-hot-toast";

// ---- distance helper (km) ----
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- normalize Geoapify feature -> common shape ----
function normalizeGeoapify(feature, lat, lng) {
  const [flng, flat] = feature.geometry.coordinates;
  return {
    id: feature.properties.place_id || `${flat},${flng}`,
    name: feature.properties.name || "Police Station",
    address: feature.properties.formatted || "",
    lat: flat,
    lng: flng,
    distanceKm: haversine(lat, lng, flat, flng),
    source: "geoapify",
  };
}

// ---- normalize Overpass element -> common shape ----
function normalizeOverpass(el, lat, lng) {
  const coords =
    el.type === "node"
      ? {
          lat: el.lat,
          lng: el.lon,
        }
      : {
          lat: el.center?.lat,
          lng: el.center?.lon,
        };

  if (!coords || coords.lat == null || coords.lng == null) {
    return null;
  }

  return {
    id: el.id,
    name: el.tags?.name || "Police Station",
    address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || "",
    lat: coords.lat,
    lng: coords.lng,
    distanceKm: haversine(lat, lng, coords.lat, coords.lng),
    source: "overpass",
  };
}

async function fetchFromGeoapify(lat, lng, radius) {
  const url = `https://api.geoapify.com/v2/places?categories=service.police&filter=circle:${lng},${lat},${radius}&bias=proximity:${lng},${lat}&limit=20&apiKey=${
    import.meta.env.VITE_GEOAPIFY_API_KEY
  }`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geoapify error: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.features)) return [];
  return data.features
    .filter((f) => f?.geometry?.coordinates)
    .map((f) => normalizeGeoapify(f, lat, lng));
}

async function fetchFromOverpass(lat, lng, radius) {
  const query = `[out:json][timeout:25];
  (
    node["amenity"="police"](around:${radius},${lat},${lng});
    way["amenity"="police"](around:${radius},${lat},${lng});
    relation["amenity"="police"](around:${radius},${lat},${lng});
    node["office"="government"]["government"="police"](around:${radius},${lat},${lng});
    way["office"="government"]["government"="police"](around:${radius},${lat},${lng});
  );
  out center tags;`;
console.log("ORS KEY:", import.meta.env.VITE_ORS_API_KEY);
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.elements)) return [];
  return data.elements
    .map((el) => normalizeOverpass(el, lat, lng))
    .filter(Boolean);
}

// ---- try Geoapify first, escalate radius, then fall back to Overpass ----
async function getNearbyStations(lat, lng) {
  const radii = [5000, 10000, 20000];

  for (const radius of radii) {
    try {
      const geoapifyResults = await fetchFromGeoapify(lat, lng, radius);
      if (geoapifyResults.length > 0) {
        return { stations: geoapifyResults.sort((a, b) => a.distanceKm - b.distanceKm), radiusUsed: radius, provider: "geoapify" };
      }
    } catch (err) {
      console.warn("Geoapify failed, will try Overpass:", err.message);
    }

    try {
      const overpassResults = await fetchFromOverpass(lat, lng, radius);
      if (overpassResults.length > 0) {
        return { stations: overpassResults.sort((a, b) => a.distanceKm - b.distanceKm), radiusUsed: radius, provider: "overpass" };
      }
    } catch (err) {
      console.warn("Overpass failed at radius", radius, err.message);
    }
  }

  return { stations: [], radiusUsed: radii[radii.length - 1], provider: null };
}

function NearbyPolice() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState("--");
  const [duration, setDuration] = useState("--");
  const [status, setStatus] = useState("locating"); // locating | loading | ready | empty | error
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation({ lat, lng });
        loadStations(lat, lng);
      },
      () => {
        setStatus("error");
        setErrorMsg("Location access denied. Please allow location access and reload.");
      }
    );
  }, []);

const loadStations = async (lat, lng) => {
  setStatus("loading");
  setErrorMsg("");

  try {
    const {
      stations: results,
      radiusUsed,
      provider,
    } = await getNearbyStations(lat, lng);

    if (results.length === 0) {
      setStatus("empty");
      setStations([]);
      return;
    }

    setStations(results);
    setStatus("ready");

    console.log(
      `Found ${results.length} station(s) via ${provider} within ${
        radiusUsed / 1000
      }km. Nearest: ${results[0].name} (${results[0].distanceKm.toFixed(
        2
      )}km)`
    );

    // ⭐ Select nearest station
    setSelectedStation(results[0]);

    // ⭐ Draw route
    findRouteToPolice(results[0], lat, lng);

  } catch (err) {
    console.error(err);
    setStatus("error");
    setErrorMsg("Failed to fetch nearby police stations. Please try again.");
  }
};

const findRouteToPolice = async (station, originLat, originLng) => {
  try {
    const lat = station.lat;
    const lng = station.lng;
    const origin = currentLocation || { lat: originLat, lng: originLng };

    if (lat == null || lng == null) {
      console.log("Invalid station:", station);
      toast.error("Location unavailable for this station");
      return;
    }

    setSelectedStation({ lat, lng, name: station.name });

    console.log("ORS KEY:", import.meta.env.VITE_ORS_API_KEY);

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: import.meta.env.VITE_ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [origin.lng, origin.lat],
            [lng, lat],
          ],
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`ORS error ${res.status}: ${errBody}`);
    }

    const data = await res.json();

    if (!data.routes || !data.routes[0]) {
      throw new Error("No route returned by ORS");
    }

    const decoded = polyline.decode(data.routes[0].geometry);

    setRoute(decoded);
    setDistance(
      (data.routes[0].summary.distance / 1000).toFixed(2) + " km"
    );
    setDuration(
      Math.round(data.routes[0].summary.duration / 60) + " mins"
    );
  } catch (err) {
    console.error(err);

    if (err.message.includes("401")) {
      toast.error("Invalid OpenRouteService API Key");
    } else if (err.message.includes("403")) {
      toast.error("OpenRouteService access denied");
    } else {
      toast.error(err.message);
    }
  }
};

  if (status === "locating") return <h2>Getting your location...</h2>;
  if (status === "error")
    return (
      <div style={{ padding: "20px" }}>
        <h2>⚠️ {errorMsg}</h2>
        {currentLocation && (
          <button onClick={() => loadStations(currentLocation.lat, currentLocation.lng)}>
            Retry
          </button>
        )}
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚔 Nearby Police Stations</h1>

      {status === "loading" && <p>Searching nearby police stations...</p>}
      {status === "empty" && (
        <p>
          No police stations found within 20km. Try again later or check your
          connection.
        </p>
      )}

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3>📏 Distance</h3>
          <p>{distance}</p>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3>⏱ ETA</h3>
          <p>{duration}</p>
        </div>
      </div>

      <MapContainer
        center={[currentLocation.lat, currentLocation.lng]}
        zoom={14}
        style={{ height: "600px", width: "100%", borderRadius: "20px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker
          center={[currentLocation.lat, currentLocation.lng]}
          radius={10}
          pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 1 }}
        >
          <Popup>📍 Your Current Location</Popup>
        </CircleMarker>

        {stations.map((station, idx) => (
        <Marker
  key={station.id}
  position={[station.lat, station.lng]}
  eventHandlers={{
    click: () => {
      setSelectedStation(station);

      findRouteToPolice(
        station,
        currentLocation.lat,
        currentLocation.lng
      );
    },
  }}
>
  <Popup>
    <h3>
      {selectedStation?.id === station.id
        ? "✅ Selected: "
        : idx === 0
        ? "🥇 Nearest: "
        : ""}
      {station.name}
    </h3>

    <p>{station.address}</p>

    <p>
      {station.distanceKm.toFixed(2)} km away (straight line)
    </p>


  </Popup>
</Marker>
        ))}

        {selectedStation && (
          <CircleMarker
            center={[selectedStation.lat, selectedStation.lng]}
            radius={10}
            pathOptions={{ color: "red", fillColor: "red", fillOpacity: 1 }}
          >
            <Popup>🚔 {selectedStation.name}</Popup>
          </CircleMarker>
        )}

        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: "#7C3AED", weight: 6 }} />
        )}
      </MapContainer>

      {selectedStation && (
        <button
          style={{
            marginTop: "20px",
            padding: "14px 28px",
            fontSize: "18px",
            border: "none",
            borderRadius: "12px",
            background: "#7C3AED",
            color: "white",
            cursor: "pointer",
          }}
          onClick={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`,
              "_blank"
            )
          }
        >
          🚗 Start Navigation
        </button>
      )}
    </div>
  );
}

export default NearbyPolice;
