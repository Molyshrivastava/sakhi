import { useState, useRef } from "react";
import axios from "axios";
import "../styles/sos.css";
import SOSPolice from "./SOSPolice";
import toast from "react-hot-toast";
function SOS() {
  const [mode, setMode] = useState("idle");
  // idle | countdown | sending | active | error

  const [count, setCount] = useState(5);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const [sosId, setSosId] = useState(null);
  const locationInterval = useRef(null);
  // 🚨 START SOS COUNTDOWN
  const startSOS = () => {
    setMode("countdown");
    setCount(5);

    // 🔊 siren sound
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    }

    let time = 5;

    intervalRef.current = setInterval(() => {
      time--;
      setCount(time);

      if (time <= 0) {
        clearInterval(intervalRef.current);
        triggerSOS();
      }
    }, 1000);
  };

  // 🚨 CANCEL SOS
  const cancelSOS = async () => {
    clearInterval(intervalRef.current);
    clearInterval(locationInterval.current);

    const token = localStorage.getItem("token");

    if (sosId) {
      try {
        await axios.put(
          "http://localhost:5000/api/sos/stop",
          {
            sosId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (err) {
        console.log(err);
      }
    }

    setMode("idle");
    setCount(5);
    setSosId(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 🚨 MAIN SOS FUNCTION
  const triggerSOS = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      return;
    }

    setMode("sending");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const res = await axios.post(
            "http://localhost:5000/api/sos/trigger",
            {
              latitude,
              longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          setSosId(res.data.sosId);

          console.log(res.data);

          setMode("active");
          locationInterval.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(async (position) => {
              try {
                await axios.put(
                  "http://localhost:5000/api/sos/update-location",
                  {
                    sosId: res.data.sosId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
              } catch (err) {
                console.log(err);
              }
            });
          }, 10000);
        } catch (err) {
          console.log(err);
          setMode("error");
        }
      },
      () => {
        toast.error("Location permission denied");
        setMode("idle");
      },
    );
  };

  return (
    <div className="sos-container">
      {/* 🔊 AUDIO */}
      <audio ref={audioRef}>
        <source src="/siren.mp3" type="audio/mp3" />
      </audio>

      {/* 🚨 IDLE STATE */}
      {mode === "idle" && (
        <div className="sos-card">
          <h2>🚨 Emergency SOS</h2>
          <p>Press only in real emergency situations</p>

          <button className="sos-btn" onClick={startSOS}>
            ACTIVATE SOS
          </button>
        </div>
      )}

      {/* ⏳ COUNTDOWN */}
      {mode === "countdown" && (
        <div className="sos-overlay">
          <h1>🚨 EMERGENCY MODE</h1>
          <div className="count">{count}</div>
          <p>Sending SOS automatically...</p>

          <button className="cancel" onClick={cancelSOS}>
            CANCEL
          </button>
        </div>
      )}

      {/* 📡 SENDING */}
      {mode === "sending" && (
        <div className="sos-overlay active">
          <h1>📡 SENDING SOS...</h1>
          <p>Please wait while we alert your contacts</p>
        </div>
      )}

      {/* ✅ SUCCESS */}
      {mode === "active" && (
        <div className="sos-overlay active">
          <h1>🚨 SOS SENT SUCCESSFULLY</h1>

          <p>Your trusted contacts have been notified.</p>
          <p>📍 Your live location is being shared.</p>

          <div className="emergency-contacts">
            <h3>Emergency Helplines</h3>

            <div className="contact-item">
              <span>🚨 National Emergency (112)</span>
              <a href="tel:112" className="call-btn">
                📞 CALL NOW
              </a>
            </div>

            <div className="contact-item">
              <span>👮 Police (100)</span>
              <a href="tel:112" className="call-btn">
                📞 CALL NOW
              </a>
            </div>

            <div className="contact-item">
              <span>🚺 Women's Helpline (1091)</span>
              <a href="tel:112" className="call-btn">
                📞 CALL NOW
              </a>
            </div>

            <div className="contact-item">
              <span>🚑 Ambulance (108)</span>
              <a href="tel:112" className="call-btn">
                📞 CALL NOW
              </a>
            </div>

            <div className="contact-item">
              <span>🔥 Fire Brigade (101)</span>
              <a href="tel:112" className="call-btn">
                📞 CALL NOW
              </a>
            </div>
          </div>
          <p
            style={{
              marginTop: "20px",
              fontWeight: "600",
              color: "#fff",
            }}
          >
            ⚠️ Press <strong>STOP ALERT</strong> to stop sharing your live
            location with your trusted contacts.
          </p>
          <button className="cancel" onClick={cancelSOS}>
            STOP ALERT
          </button>
        </div>
      )}

      {/* ❌ ERROR */}
      {mode === "error" && (
        <div className="sos-overlay">
          <h1>❌ SOS FAILED</h1>
          <p>Something went wrong. Try again.</p>

          <button className="cancel" onClick={() => setMode("idle")}>
            GO BACK
          </button>
        </div>
      )}
    </div>
  );
}

export default SOS;
