import { useState } from "react";
import axios from "axios";
import "../styles/Login.css";
import toast from "react-hot-toast";
function Login({  setUser, setShowLogin}) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleLogin = async () => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/login",
      form
    );

    setUser(res.data.user);

    localStorage.setItem("token", res.data.token);
localStorage.setItem(
  "user",
  JSON.stringify({
    _id: res.data.user._id,
    name: res.data.user.name,
    email: res.data.user.email,
  })
);
    
    localStorage.setItem("name", res.data.user.name);
    localStorage.setItem("email", res.data.user.email);

   toast.success("Login successful!");

  } catch (err) {
  toast.error("Invalid email or password");
  }
};

  return (
    <div className="login-wrapper">

      {/* BACKGROUND ANIMATION LAYERS */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>

      {/* HERO TEXT */}
      <div className="hero-section">
        <h1>💜 Sakhi</h1>
        <p>
          A next-generation safety & emotional support platform designed to
          keep you connected, protected, and heard — anytime, anywhere.
        </p>

        <div className="tags">
          <span>📞 Trusted Contacts</span>
          <span>🚨 Instant SOS</span>
          <span>💬 Emotional Support</span>
        </div>
      </div>

      {/* LOGIN CARD */}
      <div className="glass-card">
        <h2>Welcome Back</h2>
        <p className="subtext">Login to continue</p>

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button onClick={handleLogin}>Login</button>
 <p className="footer-text">
  Don't have an account?{" "}
  <span
    style={{ color: "blue", cursor: "pointer" }}
    onClick={() => setShowLogin(false)}
  >
    Register
  </span>
</p>
        <p className="footer-text">Safe • Private • Reliable</p>
      </div>

    </div>
  );
}

export default Login;