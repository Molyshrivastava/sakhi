import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/incidents",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIncidents(res.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load incidents");
    }
  };

  return (
    <div className="card">
      <h2>📋 My Incident Reports</h2>

      {incidents.length === 0 ? (
        <p>No incidents reported yet.</p>
      ) : (
        incidents.map((incident) => (
          <div
            key={incident._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginTop: "15px",
              borderRadius: "10px",
            }}
          >
            <h3>{incident.type}</h3>

            <p>
              <strong>Description:</strong>{" "}
              {incident.description}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {incident.status}
            </p>

            <p>
              <strong>Reported:</strong>{" "}
              {new Date(
                incident.createdAt
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default IncidentHistory;