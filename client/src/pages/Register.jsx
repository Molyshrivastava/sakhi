import { useState } from "react";
import axios from "axios";
import "../styles/Login.css";
import toast from "react-hot-toast";

// Set VITE_API_URL in client/.env to point somewhere else (optional).
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Register({ setShowLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return toast.error("Please fill all fields.");
    }

    if (form.password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    try {
      const res = await axios.post(`${API}/api/users/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success(res.data.message || "Registration successful");
      setShowLogin(true);
    } catch (err) {
      // Show the server's message (e.g. "User already exists")
      toast.error(
        err.response?.data?.message ||
          "Registration failed. Check your connection and try again.",
      );
    }
  };

  return (
    <div className="login-wrapper">
      {/* Animated Background */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>

      {/* Hero Section */}
      <div className="hero-section">
        <h1>💜 Sakhi</h1>
        <p>
          Join Sakhi and stay connected, protected and supported anytime,
          anywhere.
        </p>

        <div className="tags">
          <span>📞 Trusted Contacts</span>
          <span>🚨 Instant SOS</span>
          <span>💬 Emotional Support</span>
        </div>
      </div>

      {/* Register Card */}
      <div className="glass-card">
        <h2>Create Account</h2>
        <p className="subtext">Register to continue</p>

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={handleChange}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button onClick={handleRegister}>Register</button>

        <p className="footer-text">
          Already have an account?{" "}
          <span
            style={{ color: "#6c63ff", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => setShowLogin(true)}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
