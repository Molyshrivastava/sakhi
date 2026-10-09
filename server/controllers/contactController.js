const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const { normalizePhone } = require("../utils/phone");

const MAX_CONTACTS = 10; // keeps SOS fast and limits messaging cost
const RELATIONS = ["Parent", "Sibling", "Friend", "Partner", "Other"];

// Add Contact
const addContact = async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = normalizePhone(body.phone);
    const relation = RELATIONS.includes(body.relation) ? body.relation : "";

    if (!name || name.length > 60) {
      return res.status(400).json({ message: "Please enter a name." });
    }

    if (!phone) {
      return res.status(400).json({
        message:
          "Please enter a valid phone number (10 digits, or with country code like +91...).",
      });
    }

    const count = await Contact.countDocuments({ userId: req.user.id });
    if (count >= MAX_CONTACTS) {
      return res.status(400).json({
        message: `You can add up to ${MAX_CONTACTS} trusted contacts.`,
      });
    }

    const duplicate = await Contact.findOne({ userId: req.user.id, phone });
    if (duplicate) {
      return res.status(409).json({
        message: "This number is already in your Trusted Circle.",
      });
    }

    const contact = await Contact.create({
      userId: req.user.id,
      name,
      phone,
      relation,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("addContact error:", error.message);
    res.status(500).json({ message: "Could not add contact." });
  }
};

// Get Contacts (favourites first)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.user.id,
    }).sort({ favorite: -1, createdAt: 1 });

    res.json(contacts);
  } catch (error) {
    console.error("getContacts error:", error.message);
    res.status(500).json({ message: "Could not load contacts." });
  }
};

// Delete Contact
const deleteContact = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid contact id." });
    }

    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact Deleted" });
  } catch (error) {
    console.error("deleteContact error:", error.message);
    res.status(500).json({ message: "Could not delete contact." });
  }
};

// Toggle Favorite (only your own contacts)
const toggleFavorite = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid contact id." });
    }

    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contact.favorite = !contact.favorite;
    await contact.save();

    res.json(contact);
  } catch (error) {
    console.error("toggleFavorite error:", error.message);
    res.status(500).json({ message: "Could not update contact." });
  }
};

module.exports = {
  addContact,
  getContacts,
  deleteContact,
  toggleFavorite,
};
