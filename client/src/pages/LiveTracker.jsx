import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import axios from "axios";

function LiveTracker() {
  const { id } = useParams();

  const [location, setLocation] = useState(null);

  useEffect(() => {

    const loadLocation = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/sos/${id}`
        );

        setLocation({
          lat: res.data.latitude,
          lng: res.data.longitude,
        });

      } catch (err) {
        console.log(err);
      }
    };

    loadLocation();

    const interval = setInterval(loadLocation, 10000);

    return () => clearInterval(interval);

  }, [id]);

  if (!location) return <h2>Loading...</h2>;

  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={15}
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[location.lat, location.lng]}
      />
    </MapContainer>
  );
}

export default LiveTracker;