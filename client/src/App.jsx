import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.log("Invalid saved user data");
        localStorage.removeItem("user");
        return null;
      }
    }

    return null;
  });

  const [showLogin, setShowLogin] = useState(true);

  const handleSetUser = (newUser) => {
    setUser(newUser);

    if (newUser) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        })
      );
    } else {
      localStorage.removeItem("user");
    }
  };

  if (user) {
    return <Dashboard setUser={handleSetUser} />;
  }

  return showLogin ? (
    <Login
      setUser={handleSetUser}
      setShowLogin={setShowLogin}
    />
  ) : (
    <Register
      setShowLogin={setShowLogin}
    />
  );
}

export default App;