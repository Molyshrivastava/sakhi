import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "../styles/saferoute.css";
import axios from "axios";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import toast from "react-hot-toast";
// Default Leaflet marker (red)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function SafeRoute() {
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
const [safetyScore, setSafetyScore] = useState("--");
const [incidentCount, setIncidentCount] = useState(0);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState("--");
  const [duration, setDuration] = useState("--");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
       
        toast.error("Please allow location access.");
      }
    );
  }, []);

  const searchDestination = async (value) => {
    setDestination(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${
          import.meta.env.VITE_ORS_API_KEY
        }&text=${encodeURIComponent(value)}&boundary.country=IND`
      );

      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.log(err);
    }
  };

  const findRoute = async () => {

  if (!currentLocation || !destinationCoords) {
    return toast.error("Select a destination first.");
  }

  try {

    // Get route
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
            [currentLocation.lng, currentLocation.lat],
            [destinationCoords.lng, destinationCoords.lat],
          ],
        }),
      }
    );

    const data = await res.json();

    // Draw route
    const coords = polyline.decode(data.routes[0].geometry);
    setRoute(coords);

    // Distance
    setDistance(
      (data.routes[0].summary.distance / 1000).toFixed(2) + " km"
    );

    // ETA
    setDuration(
      Math.round(data.routes[0].summary.duration / 60) + " mins"
    );

    // -----------------------------
    // FETCH INCIDENTS
    // -----------------------------
    const token = localStorage.getItem("token");

    const incidentRes = await axios.get(
      "http://localhost:5000/api/incidents/community",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const incidents = incidentRes.data;
console.log("Current Location:", currentLocation);
console.log("Destination:", destinationCoords);
console.log("Incidents:", incidents);
let nearby = 0;

const minLat = Math.min(currentLocation.lat, destinationCoords.lat);
const maxLat = Math.max(currentLocation.lat, destinationCoords.lat);

const minLng = Math.min(currentLocation.lng, destinationCoords.lng);
const maxLng = Math.max(currentLocation.lng, destinationCoords.lng);

incidents.forEach((incident) => {
  if (
    incident.latitude >= minLat &&
    incident.latitude <= maxLat &&
    incident.longitude >= minLng &&
    incident.longitude <= maxLng
  ) {
    nearby++;
  }
});

const score = Math.max(100 - nearby * 15, 10);

setIncidentCount(nearby);
setSafetyScore(score);

// Save values for Dashboard
localStorage.setItem("safetyScore", score);
localStorage.setItem("incidentCount", nearby);

  } catch (err) {
    console.log(err);
  }
};

  return (
    <div className="safe-route-page">

      <div className="route-header">
        <h1>🛣 Safe Route</h1>
        <p>Find the safest path to your destination</p>
      </div>

      <div className="search-card">

        <label>📍 From</label>
        <input value="Current Location" disabled />

        <label>🎯 Destination</label>

        <input
          value={destination}
          onChange={(e) => searchDestination(e.target.value)}
          placeholder="Enter destination..."
        />

        {suggestions.length > 0 && (
          <div className="search-results">
            {suggestions.map((place) => (
              <div
                key={place.properties.id}
                className="result-item"
                onClick={() => {
                  setDestination(place.properties.label);

                  setDestinationCoords({
                    lat: place.geometry.coordinates[1],
                    lng: place.geometry.coordinates[0],
                  });

                  setSuggestions([]);
                }}
              >
                📍 {place.properties.label}
              </div>
            ))}
          </div>
        )}

        <button onClick={findRoute}>
          Find Safest Route
        </button>

      </div>

      <div className="route-result">

        <div className="info-box">
          <h3>⭐ Safety Score</h3>
          <p>{safetyScore}</p>
        </div>

        <div className="info-box">
          <h3>📏 Distance</h3>
          <p>{distance}</p>
        </div>

        <div className="info-box">
          <h3>⏱ ETA</h3>
          <p>{duration}</p>
        </div>

        <div className="info-box">
          <h3>🚨 Incidents Nearby</h3>
          <p>{incidentCount}</p>
        </div>

      </div>

      <MapContainer
        center={
          currentLocation
            ? [currentLocation.lat, currentLocation.lng]
            : [21.1938, 81.3509]
        }
        zoom={13}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "20px",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current Location */}
        {currentLocation && (
          <>
            <CircleMarker
              center={[
                currentLocation.lat,
                currentLocation.lng,
              ]}
              radius={10}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 1,
              }}
            />

            <Popup
              position={[
                currentLocation.lat,
                currentLocation.lng,
              ]}
            >
              📍 Your Current Location
            </Popup>
          </>
        )}

        {/* Destination */}
        {destinationCoords && (
          <Marker
            position={[
              destinationCoords.lat,
              destinationCoords.lng,
            ]}
          >
            <Popup>
              🎯 {destination}
            </Popup>
          </Marker>
        )}

        {/* Route */}
        {route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: "#7C3AED",
              weight: 6,
            }}
          />
        )}

      </MapContainer>

      <button className="start-btn">
        🚗 Start Navigation
      </button>

    </div>
  );
}

export default SafeRoute;