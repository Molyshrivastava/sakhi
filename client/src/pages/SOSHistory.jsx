import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/soshistory.css";

function SOSHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteHistory = async (id) => {
    if (!window.confirm("Delete this SOS history?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/api/sos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/sos/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="history-container">
      <h1>🚨 SOS History</h1>

      {history.length === 0 ? (
        <p>No SOS alerts found.</p>
      ) : (
        history.map((item) => (
          <div className="history-card" key={item._id}>
            <h3>{new Date(item.createdAt).toLocaleDateString()}</h3>

            <p>🕒 {new Date(item.createdAt).toLocaleTimeString()}</p>

            <p>
              <strong>Status:</strong> {item.status}
            </p>
            <div className="action-buttons">
              <a
                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="view-btn"
              >
                📍 View Location
              </a>

              <button
                className="delete-btn"
                onClick={() => deleteHistory(item._id)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SOSHistory;
