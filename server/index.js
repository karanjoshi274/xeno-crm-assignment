// server/index.js (or middleware file)
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Campaign = require('./models/Campaign');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(express.json());
app.use(cors());

// Helper function to get matching customers based on rules
async function findMatchingCustomers(rules) {
  let customerQuery = {};
  let orderQuery = {};
  
  // Build queries
  for (let rule of rules) {
    const { table, field, operator, value } = rule;
    const numVal = parseFloat(value);
    if (table === 'customer') {
      // Customer field queries
      if (operator === 'eq') {
        customerQuery[field] = isNaN(numVal) ? value : numVal;
      } else if (operator === 'gt') {
        customerQuery[field] = { $gt: numVal };
      } else if (operator === 'lt') {
        customerQuery[field] = { $lt: numVal };
      } else if (operator === 'neq') {
        customerQuery[field] = { $ne: isNaN(numVal) ? value : numVal };
      }
    } else if (table === 'order') {
      // Order field queries
      if (!orderQuery[field]) {
        orderQuery[field] = {};
      }
      // Support only one condition per field for simplicity
      if (operator === 'eq') {
        orderQuery[field] = isNaN(numVal) ? value : numVal;
      } else if (operator === 'gt') {
        orderQuery[field] = { $gt: numVal };
      } else if (operator === 'lt') {
        orderQuery[field] = { $lt: numVal };
      } else if (operator === 'neq') {
        orderQuery[field] = { $ne: isNaN(numVal) ? value : numVal };
      }
    }
  }

  // If there are order rules, find matching customers via orders
  if (Object.keys(orderQuery).length > 0) {
    const orders = await Order.find(orderQuery).select('customerId');
    const customerIds = [...new Set(orders.map(o => o.customerId))];
    customerQuery['_id'] = { $in: customerIds };
  }

  // Find customers matching customerQuery (and in the set from orders if applicable)
  const customers = await Customer.find(customerQuery);
  return customers;
}


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


// --- Authentication Route ---

// POST /api/auth/google
// Body: { token: <Google ID token> }
// Verifies token with Google, then creates/returns a JWT for our app.
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload(); // contains user's Google info
    const { sub: googleId, email, name, picture } = payload;
    // Find or create user in DB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    }
    // Sign our JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    res.json({ token: jwtToken, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// JWT auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, ... }
    next();
  } catch(err) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// --- Customer Ingestion ---

// POST /api/customers
// Expects JSON array of customer objects: [{ name, email, age, city }, ...]
app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.insertMany(req.body);
    res.json({ message: 'Customers added', count: customers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add customers' });
  }
});

// (Optional) GET /api/customers to retrieve list (protected)
app.get('/api/customers', authenticateToken, async (req, res) => {
  const all = await Customer.find();
  res.json(all);
});

// --- Order Ingestion ---

// POST /api/orders
// Expects JSON array of order objects: [{ orderId, product, amount, date, customerId }, ...]
// Note: date should be ISO string or omitted.
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Optionally parse date strings to Date
    const ordersData = req.body.map(order => ({
      ...order,
      date: order.date ? new Date(order.date) : new Date()
    }));
    const orders = await Order.insertMany(ordersData);
    res.json({ message: 'Orders added', count: orders.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add orders' });
  }
});

// GET /api/orders to list (protected)
app.get('/api/orders', authenticateToken, async (req, res) => {
  const all = await Order.find();
  res.json(all);
});

// POST /api/campaigns/preview
app.post('/api/campaigns/preview', authenticateToken, async (req, res) => {
  try {
    const rules = req.body.rules || [];
    const matched = await findMatchingCustomers(rules);
    res.json({ count: matched.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to preview audience' });
  }
});

// POST /api/campaigns
app.post('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const { name, objective, rules } = req.body;
    const matched = await findMatchingCustomers(rules);
    const audienceCount = matched.length;

    const campaign = new Campaign({
      name,
      objective,
      rules,
      audienceCount,
      logs: [],
      createdBy: req.user.id
    });

    matched.forEach(customer => {
      const success = Math.random() < 0.9;
      const status = success ? 'SENT' : 'FAILED';
      const opened = success && Math.random() < 0.3;
      campaign.logs.push({ customer: customer._id, status, opened });
    });

    await campaign.save();
    res.json({ message: 'Campaign created', campaignId: campaign._id, audienceCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.json(campaigns);
});

// GET /api/campaigns/:id
app.get('/api/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('logs.customer', 'name email');
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get campaign' });
  }
});

// GET /api/campaigns/suggestions?objective=...
app.get('/api/campaigns/suggestions', authenticateToken, (req, res) => {
  const objective = req.query.objective || '';
  const suggestion1 = `Dear Customer, our goal is to ${objective}. We are excited to offer you special deals to help us achieve this together!`;
  const suggestion2 = `Hello! We want to ${objective}. Check out our amazing offers tailored just for you.`;
  res.json({ suggestions: [suggestion1, suggestion2] });
});

// GET /api/campaigns/:id/summary
app.get('/api/campaigns/:id/summary', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const total = campaign.audienceCount || 0;
    const delivered = campaign.logs.filter(l => l.status === 'SENT').length;
    const deliveredPct = total ? ((delivered / total) * 100).toFixed(0) : 0;
    const opened = campaign.logs.filter(l => l.opened).length;
    const openPct = delivered ? ((opened / delivered) * 100).toFixed(0) : 0;

    const summary = `Your campaign reached ${total} users. ${delivered} messages were delivered successfully (${deliveredPct}%). ` +
                    `Approximately ${openPct}% of delivered messages were opened by customers.`;

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
