import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
function WhatsAppGroup() {
  const [link, setLink] = useState("");

  const saveGroup = async () => {
    const token = localStorage.getItem("token");

    await axios.post(
      "http://localhost:5000/api/users/save-group",
      { groupLink: link },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    toast.success("Group saved!");
  };

  return (
    <div>
      <h3>Emergency WhatsApp Group</h3>

      <input
        placeholder="Paste group invite link"
        onChange={(e) => setLink(e.target.value)}
      />

      <button onClick={saveGroup}>Save Group</button>
    </div>
  );
}

export default WhatsAppGroup;
