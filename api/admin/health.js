require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');
const emailService = require('../../services/emailService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        googleSheets: 'unknown',
        email: 'unknown',
        scheduler: 'unknown'
      }
    };

    // Check Google Sheets
    try {
      await googleSheetsService.getAllSubmissions();
      health.services.googleSheets = 'healthy';
    } catch (error) {
      health.services.googleSheets = 'error';
    }

    // Check email service
    try {
      await emailService.transporter.verify();
      health.services.email = 'healthy';
    } catch (error) {
      health.services.email = 'error';
    }

    // Check scheduler (always running in serverless)
    health.services.scheduler = 'running';

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({
      error: 'Failed to check system health'
    });
  }
};