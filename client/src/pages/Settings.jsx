import { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaUser,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaBell,
  FaPhoneAlt,
  FaInfoCircle,
  FaChevronRight,
  FaChevronDown,
  FaSignOutAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import "../styles/settings.css";
import axios from "axios";
function Settings() {
  const [siren, setSiren] = useState(
    JSON.parse(localStorage.getItem("siren")) ?? true,
  );

  const [liveLocation, setLiveLocation] = useState(
    JSON.parse(localStorage.getItem("liveLocation")) ?? true,
  );

  const [emergencyAlerts, setEmergencyAlerts] = useState(
    JSON.parse(localStorage.getItem("emergencyAlerts")) ?? true,
  );

  const [communityAlerts, setCommunityAlerts] = useState(
    JSON.parse(localStorage.getItem("communityAlerts")) ?? true,
  );

  const [safetyTips, setSafetyTips] = useState(
    JSON.parse(localStorage.getItem("safetyTips")) ?? true,
  );

  const [countdown, setCountdown] = useState(
    Number(localStorage.getItem("countdown")) || 5,
  );

  const [openSection, setOpenSection] = useState("");

  const userName = localStorage.getItem("name") || "User";
  const userEmail = localStorage.getItem("email") || "No Email";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    setCountdown(Number(localStorage.getItem("countdown")) || 5);
    setSiren(localStorage.getItem("siren") !== "false");
    setLiveLocation(localStorage.getItem("liveLocation") !== "false");
  }, []);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const logout = () => {
    if (window.confirm("Logout from Sakhi?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      window.location.reload();
    }
  };

  const saveSettings = () => {
    localStorage.setItem("siren", JSON.stringify(siren));
    localStorage.setItem("liveLocation", JSON.stringify(liveLocation));
    localStorage.setItem("emergencyAlerts", JSON.stringify(emergencyAlerts));
    localStorage.setItem("communityAlerts", JSON.stringify(communityAlerts));
    localStorage.setItem("safetyTips", JSON.stringify(safetyTips));
    localStorage.setItem("countdown", countdown);

    toast.success("Settings saved successfully!");
  };

  const sendOTP = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/users/send-otp",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.message);

      setOtpSent(true);
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleChangePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      return toast.error("Fill all fields.");
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/api/users/verify-otp",
        {
          otp,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.message);

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpSent(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed.");
    }
  };

  return (
    <div className="settings-page">
      <div className="profile-card">
        <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>

        <h2>{userName}</h2>

        <p>{userEmail}</p>
      </div>
      {/* ================= ACCOUNT ================= */}

      <div className="settings-tile" onClick={() => toggleSection("account")}>
        <div>
          <FaUser />
          <div>
            <h3>Account</h3>
            <p>Manage your profile</p>
          </div>
        </div>

        {openSection === "account" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "account" && (
        <div className="settings-body">
          <label>Name</label>
          <input value={userName} disabled />

          <label>Email</label>
          <input value={userEmail} disabled />
        </div>
      )}

      {/* ================= SECURITY ================= */}

      <div className="settings-tile" onClick={() => toggleSection("security")}>
        <div>
          <FaShieldAlt />
          <div>
            <h3>Security</h3>
            <p>Change your password securely</p>
          </div>
        </div>

        {openSection === "security" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "security" && (
        <div className="settings-body">
          <label>Registered Email</label>
          <input value={userEmail} disabled />

          <button className="save-btn" onClick={sendOTP} disabled={timer > 0}>
            {timer > 0 ? `Resend OTP (${timer}s)` : "Send OTP"}
          </button>

          {otpSent && (
            <>
              <label>OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className="save-btn" onClick={handleChangePassword}>
                Update Password
              </button>
            </>
          )}
        </div>
      )}

      {/* Emergency */}

      <div className="settings-tile" onClick={() => toggleSection("emergency")}>
        <div>
          <FaShieldAlt />

          <div>
            <h3>Emergency Settings</h3>

            <p>SOS preferences</p>
          </div>
        </div>

        {openSection === "emergency" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "emergency" && (
        <div className="settings-body">
          <label>SOS Countdown</label>

          <select
            value={countdown}
            onChange={(e) => setCountdown(Number(e.target.value))}
          >
            <option value={5}>5 Seconds</option>

            <option value={10}>10 Seconds</option>

            <option value={15}>15 Seconds</option>
          </select>

          <div className="switch-row">
            <span>Siren</span>

            <label className="switch">
              <input
                type="checkbox"
                checked={siren}
                onChange={() => setSiren(!siren)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="switch-row">
            <span>Share Live Location</span>

            <label className="switch">
              <input
                type="checkbox"
                checked={liveLocation}
                onChange={() => setLiveLocation(!liveLocation)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button className="save-btn" onClick={saveSettings}>
            Save
          </button>
        </div>
      )}

      {/* Privacy */}

      <div className="settings-tile" onClick={() => toggleSection("privacy")}>
        <div>
          <FaMapMarkerAlt />

          <div>
            <h3>Privacy & Location</h3>

            <p>Manage permissions</p>
          </div>
        </div>

        {openSection === "privacy" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "privacy" && (
        <div className="settings-body">
          <p>📍 Your location is only shared during an SOS emergency.</p>
        </div>
      )}

      {/* Notifications */}

      <div
        className="settings-tile"
        onClick={() => toggleSection("notifications")}
      >
        <div>
          <FaBell />

          <div>
            <h3>Notifications</h3>

            <p>Safety alerts</p>
          </div>
        </div>

        {openSection === "notifications" ? (
          <FaChevronDown />
        ) : (
          <FaChevronRight />
        )}
      </div>

      {openSection === "notifications" && (
        <div className="settings-body">
          <div className="switch-row">
            <span>Emergency Alerts</span>

            <label className="switch">
              <input
                type="checkbox"
                checked={emergencyAlerts}
                onChange={() => setEmergencyAlerts(!emergencyAlerts)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="switch-row">
            <span>Community Alerts</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={communityAlerts}
                onChange={() => setCommunityAlerts(!communityAlerts)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="switch-row">
            <span>Safety Tips</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={safetyTips}
                onChange={() => setSafetyTips(!safetyTips)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button className="save-btn" onClick={saveSettings}>
            Save
          </button>
        </div>
      )}

      {/* Emergency Numbers */}

      <div className="settings-tile" onClick={() => toggleSection("numbers")}>
        <div>
          <FaPhoneAlt />

          <div>
            <h3>Emergency Numbers</h3>

            <p>Quick help</p>
          </div>
        </div>

        {openSection === "numbers" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "numbers" && (
        <div className="settings-body">
          <a href="tel:112" className="call-card">
            🚓 Police - Call 112
          </a>

          <a href="tel:1091" className="call-card">
            👩 Women Helpline - Call 1091
          </a>

          <a href="tel:108" className="call-card">
            🚑 Ambulance - Call 108
          </a>
        </div>
      )}

      {/* About */}

      <div className="settings-tile" onClick={() => toggleSection("about")}>
        <div>
          <FaInfoCircle />

          <div>
            <h3>About Sakhi</h3>

            <p>Version & Developer</p>
          </div>
        </div>

        {openSection === "about" ? <FaChevronDown /> : <FaChevronRight />}
      </div>

      {openSection === "about" && (
        <div className="settings-body">
          <h2>💜 Sakhi</h2>

          <p>Women's Safety & Emergency Assistance Platform</p>

          <p>Version 1.0</p>

          <p>Made with ❤️ by Moly Shrivastava</p>
        </div>
      )}

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );
}

export default Settings;
