const Contact = require("../models/Contact");

// Add Contact
const addContact = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const contact = await Contact.create({
      userId: req.user.id,
      name,
      phone,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Contacts
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.user.id,
    });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Contact
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.json({
      message: "Contact Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Toggle Favorite
const toggleFavorite = async (req, res) => {
  try {
    const contact = await Contact.findById(
      req.params.id
    );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    contact.favorite =
      !contact.favorite;

    await contact.save();

    res.json(contact);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addContact,
  getContacts,
  deleteContact,
  toggleFavorite,
};