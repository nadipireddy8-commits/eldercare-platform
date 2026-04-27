const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  bookingId: String,
  note: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CareNote", schema);