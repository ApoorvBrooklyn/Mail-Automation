require('dotenv').config();
const trackingService = require('../../../services/trackingService');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, url } = req.query;
    
    if (!email || !url) {
      console.error('❌ Missing email or url for link tracking');
      return res.status(400).send('Missing email or url parameter');
    }

    await trackingService.trackLinkClick(email, url);

    // Redirect to the original URL
    res.redirect(url);

  } catch (error) {
    console.error('❌ Error tracking link click:', error);
    // Still redirect even if tracking fails
    const { url } = req.query;
    if (url) {
      res.redirect(url);
    } else {
      res.status(500).send('Tracking error');
    }
  }
};