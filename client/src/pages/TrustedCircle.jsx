import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/trustedcircle.css";
import toast from "react-hot-toast";
function TrustedCircle() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setContacts(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = async () => {
    try {
      if (!form.name || !form.phone) {
        toast.error("Fill all fields");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/contacts/add",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(res.data);

      setForm({
        name: "",
        phone: "",
      });

      fetchContacts();
    } catch (error) {
      console.log(error);

      toast.error("Failed to add contact");
    }
  };

  const deleteContact = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/contacts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchContacts();
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/contacts/favorite/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchContacts();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const sortedContacts = [...contacts].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite),
  );

  const filteredContacts = sortedContacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="contacts-wrapper">
      <div className="card">
        <h2>➕ Add Contact</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />

        <button className="primary-btn" onClick={handleAdd}>
          Add Contact
        </button>
      </div>

      <input
        className="search"
        placeholder="🔍 Search contacts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="list">
        {filteredContacts.map((c) => (
          <div className="contact-card" key={c._id}>
            <div>
              <h3>
                {c.name}
                {c.favorite && <span className="star">⭐</span>}
              </h3>

              <p>{c.phone}</p>
            </div>

            <div className="actions">
              <a href={`tel:${c.phone}`}>
                <button className="call">📞</button>
              </a>

              <a
                href={`https://wa.me/${c.phone}`}
                target="_blank"
                rel="noreferrer"
              >
                <button className="wa">💬</button>
              </a>

              <button onClick={() => toggleFavorite(c._id)}>⭐</button>

              <button className="delete" onClick={() => deleteContact(c._id)}>
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustedCircle;
