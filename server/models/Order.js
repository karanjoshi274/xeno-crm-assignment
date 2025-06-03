// server/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  product: String,
  amount: Number,
  date: Date,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }
});

module.exports = mongoose.model('Order', orderSchema);
