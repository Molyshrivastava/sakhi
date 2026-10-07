import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/incidentreport.css";

function IncidentReport() {
  const [type, setType] = useState("Harassment");
  const [description, setDescription] = useState("");

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // =========================
  // FETCH MY INCIDENT HISTORY
  // =========================
  const fetchMyIncidents = async () => {
    try {
      setLoadingIncidents(true);

      const response = await axios.get(
        "http://localhost:5000/api/incidents/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIncidents(response.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load incident history");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyIncidents();
    } else {
      setLoadingIncidents(false);
    }
  }, []);

  // =========================
  // SUBMIT INCIDENT
  // =========================
  const submitIncident = () => {
    if (!description.trim()) {
      toast.error("Please describe what happened.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location is not supported by your browser.");
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(
            "http://localhost:5000/api/incidents",
            {
              type,
              description,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          toast.success("✅ Incident Reported Successfully");

          setDescription("");
          setType("Harassment");

          // Refresh incident history
          fetchMyIncidents();
        } catch (err) {
          console.log(err);
          toast.error("Failed to report incident");
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        toast.error("Please allow location access.");
        setSubmitting(false);
      },
    );
  };

  // =========================
  // DELETE INCIDENT
  // =========================
  const deleteIncident = async (incidentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this incident report?\n\n" +
        "It will also be removed from the Community Safety Map.",
    );

    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/incidents/${incidentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Immediately remove it from the history UI
      setIncidents((prev) =>
        prev.filter((incident) => incident._id !== incidentId),
      );

      toast.success("🗑️ Incident deleted successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete incident");
    }
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="incident-page">
      {/* =========================
          REPORT INCIDENT
      ========================= */}
      <div className="incident-card report-card">
        <div className="incident-heading">
          <div className="incident-heading-icon">🚨</div>

          <div>
            <h2>Report an Incident</h2>
            <p>Help keep your community safe by reporting unsafe incidents.</p>
          </div>
        </div>

        <div className="incident-form">
          <label>Incident Type</label>

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Harassment</option>
            <option>Stalking</option>
            <option>Theft</option>
            <option>Poor Street Lighting</option>
            <option>Unsafe Area</option>
            <option>Suspicious Activity</option>
          </select>

          <label>What happened?</label>

          <textarea
            placeholder="Describe what happened..."
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="location-info">
            📍 Your current location will be attached to this report.
          </div>

          <button
            className="submit-incident-btn"
            onClick={submitIncident}
            disabled={submitting}
          >
            {submitting ? "Reporting..." : "🚨 Submit Report"}
          </button>
        </div>
      </div>

      {/* =========================
          INCIDENT HISTORY
      ========================= */}
      <div className="incident-card history-card">
        <div className="history-heading">
          <div>
            <h2>📋 My Reported Incidents</h2>
            <p>View and manage incidents you have reported.</p>
          </div>

          <span className="incident-count">{incidents.length}</span>
        </div>

        {loadingIncidents ? (
          <div className="incident-empty">
            <div className="loading-spinner"></div>
            <p>Loading your incident history...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="incident-empty">
            <div className="empty-icon">📋</div>
            <h3>No incidents reported</h3>
            <p>Your reported incidents will appear here.</p>
          </div>
        ) : (
          <div className="incident-list">
            {incidents.map((incident) => (
              <div className="incident-history-item" key={incident._id}>
                <div className="incident-item-top">
                  <div className="incident-type">🚨 {incident.type}</div>

                  <div className="incident-date">
                    {formatDate(incident.createdAt)}
                  </div>
                </div>

                <p className="incident-description">{incident.description}</p>

                <div className="incident-location">📍 Location recorded</div>

                <div className="incident-item-actions">
                  <button
                    className="delete-incident-btn"
                    onClick={() => deleteIncident(incident._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentReport;
