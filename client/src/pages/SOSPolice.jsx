import { useEffect, useState } from "react";

function SOSPolice({ latitude, longitude }) {
  const [police, setPolice] = useState(null);

  useEffect(() => {
    fetchNearbyPolice();
  }, []);

  const fetchNearbyPolice = async () => {
    try {
      const res = await fetch(
        `https://overpass-api.de/api/interpreter?data=
[out:json];
node
["amenity"="police"]
(around:5000,${latitude},${longitude});
out;`
      );

      const data = await res.json();

      if (data.elements.length > 0) {
        setPolice(data.elements[0]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        marginTop: "25px",
        background: "#fff",
        padding: "20px",
        borderRadius: "15px",
      }}
    >
      <h2>🚔 Emergency Help</h2>

      {police ? (
        <>
          <p>
            <strong>Nearest Police Station</strong>
          </p>

          <p>
            {police.tags.name || "Police Station"}
          </p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${police.lat},${police.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            📍 Open in Maps
          </a>
        </>
      ) : (
        <p>Finding nearest police station...</p>
      )}

      <hr />

      <h3>🚺 Women's Helpline</h3>

      <a href="tel:1091">
        📞 Call 1091
      </a>

      <hr />

      <h3>🚨 National Emergency</h3>

      <a href="tel:112">
        📞 Call 112
      </a>
    </div>
  );
}

export default SOSPolice;