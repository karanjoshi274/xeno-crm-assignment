// server/models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: String,
  objective: String,
  rules: [], // we store the array of rule objects
  audienceCount: Number,
  logs: [
    {
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      status: String,
      opened: Boolean
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', campaignSchema);
