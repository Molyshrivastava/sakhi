const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  addContact,
  getContacts,
  deleteContact,
  toggleFavorite,
} = require("../controllers/contactController");

router.post("/add", verifyToken, addContact);

router.get("/", verifyToken, getContacts);

router.delete("/:id", verifyToken, deleteContact);

router.patch("/favorite/:id", verifyToken, toggleFavorite);

module.exports = router;
