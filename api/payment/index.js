require('dotenv').config();
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract email and tracking ID from query parameters
  const { email, trackingId } = req.query;
  
  if (!email) {
    return res.status(400).send('Email parameter is required');
  }
  
  // Redirect to the payment page (served from public folder by Vercel)
  res.redirect(`/payment.html?email=${encodeURIComponent(email)}&trackingId=${trackingId || ''}`);
};