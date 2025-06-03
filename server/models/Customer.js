// server/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  city: String
});

module.exports = mongoose.model('Customer', customerSchema);
