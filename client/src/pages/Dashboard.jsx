import {
  FaHome,
  FaRoute,
  FaUserFriends,
  FaRobot,
  FaShieldAlt,
  FaMapMarkedAlt,
  FaClipboardList,
  FaHospital,
  FaPhoneAlt,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";
import SOSHistory from "./SOSHistory";
import { FaHistory } from "react-icons/fa";
import SafetyMap from "./SafetyMap";
import TrustedCircle from "./TrustedCircle";
import SOS from "./SOS";
import AISafetyAssistant from "./AISafetyAssistant";
import IncidentReport from "./IncidentReport";
import SafeRoute from "./SafeRoute";
import NearbyPolice from "./NearbyPolice";
import Settings from "./Settings";
import FakeCall from "./FakeCall";
import "../styles/dashboard.css";

function Dashboard({ setUser }) {
  const [active, setActive] = useState("home");
  const [safetyScore, setSafetyScore] = useState(100);
  const [incidentCount, setIncidentCount] = useState(0);
  const fetchSafetyStatus = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem("token");

          const res = await axios.get(
            "http://localhost:5000/api/incidents/safety-status",
            {
              params: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          setSafetyScore(res.data.safetyScore);
          setIncidentCount(res.data.nearbyIncidents);
        } catch (err) {
          console.log(err);
        }
      },
      () => {
        console.log("Location permission denied");
      },
    );
  };

  useEffect(() => {
    // Fetch when Dashboard first loads
    fetchSafetyStatus();

    // Fetch again whenever a new incident is reported
    const handleIncidentReported = () => {
      fetchSafetyStatus();
    };

    window.addEventListener("incidentReported", handleIncidentReported);

    return () => {
      window.removeEventListener("incidentReported", handleIncidentReported);
    };
  }, []);

  const logout = () => {
    if (window.confirm("Logout from Sakhi?")) {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const renderContent = () => {
    switch (active) {
      case "trusted":
        return <TrustedCircle />;

      case "support":
        return <AISafetyAssistant />;

      case "incident":
        return <IncidentReport />;

      case "route":
        return <SafeRoute />;

      case "map":
        return <SafetyMap />;

      case "police":
        return <NearbyPolice />;

      case "sos":
        return <SOS />;

      case "history":
        return <SOSHistory />;

      case "settings":
        return <Settings />;

      case "fakecall":
        return <FakeCall />;

      default:
        return (
          <div className="home-page">
            <div className="welcome-card">
              <h1>💜 Welcome to Sakhi</h1>
              <p>Your Intelligent Women's Safety Companion</p>
            </div>

            <div className="status-card">
              {safetyScore >= 90 ? (
                <>
                  <h3>🟢 Safe Area</h3>
                  <p>Safety Score: {safetyScore}/100</p>
                  <p>Nearby Incidents: {incidentCount}</p>
                </>
              ) : safetyScore >= 70 ? (
                <>
                  <h3>🟡 Caution</h3>
                  <p>Safety Score: {safetyScore}/100</p>
                  <p>Nearby Incidents: {incidentCount}</p>
                  <p>Be alert and stay aware of your surroundings.</p>
                </>
              ) : (
                <>
                  <h3>🔴 Unsafe Area</h3>
                  <p>Safety Score: {safetyScore}/100</p>
                  <p>Nearby Incidents: {incidentCount}</p>
                  <p>
                    Avoid this area if possible and consider sharing your live
                    location.
                  </p>
                </>
              )}
            </div>

            <div className="sos-card" onClick={() => setActive("sos")}>
              🚨
              <h2>EMERGENCY SOS</h2>
              <p>Press only during emergency</p>
            </div>

            <h2 className="section-title">Quick Safety Services</h2>

            <div className="card-grid">
              <div className="feature-card" onClick={() => setActive("route")}>
                <FaRoute size={35} />
                <h3>Safer Route</h3>
                <p>Find safest way home</p>
              </div>

              <div
                className="feature-card"
                onClick={() => setActive("trusted")}
              >
                <FaUserFriends size={35} />
                <h3>Trusted Circle</h3>
                <p>Manage emergency contacts</p>
              </div>

              <div className="feature-card" onClick={() => setActive("police")}>
                <FaShieldAlt size={35} />
                <h3>Nearby Police</h3>
                <p>Get immediate help</p>
              </div>

              <div
                className="feature-card"
                onClick={() => setActive("support")}
              >
                <FaRobot size={35} />
                <h3>AI Support</h3>
                <p>Talk freely anytime</p>
              </div>
            </div>

            <div className="tip-card">
              💡 Always share your trip with someone you trust.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>💜 Sakhi</h2>

        <button onClick={() => setActive("home")}>
          <FaHome /> Dashboard
        </button>

        <button onClick={() => setActive("incident")}>
          <FaClipboardList /> Report Incident
        </button>
        <button onClick={() => setActive("history")}>
          <FaHistory /> SOS History
        </button>
        <button onClick={() => setActive("map")}>
          <FaMapMarkedAlt /> Community Safety Map
        </button>

        <button onClick={() => setActive("police")}>
          <FaShieldAlt /> Nearby Police
        </button>

        {/* <button onClick={() => setActive("hospital")}>
          <FaHospital /> Nearby Hospital
        </button> */}

        <button onClick={() => setActive("fakecall")}>
          <FaPhoneAlt /> Fake Call
        </button>

        <button onClick={() => setActive("settings")}>
          <FaCog /> Settings
        </button>
      </aside>

      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default Dashboard;
