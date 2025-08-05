require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');

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
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let allSubmissions = await googleSheetsService.getAllSubmissions();

    // Filter by status if provided
    if (status) {
      allSubmissions = allSubmissions.filter(sub => sub.status === status);
    }

    // Apply pagination
    const paginatedSubmissions = allSubmissions.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        total: allSubmissions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions'
    });
  }
};