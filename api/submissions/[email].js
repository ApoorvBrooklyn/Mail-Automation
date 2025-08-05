require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  const { email } = req.query;

  if (req.method === 'GET') {
    // Get submission by email
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      
      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('❌ Error fetching submission:', error);
      res.status(500).json({
        error: 'Failed to fetch submission'
      });
    }
  } else if (req.method === 'PATCH') {
    // Update submission status (admin only)
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'Status is required'
        });
      }

      await googleSheetsService.updateStatus(email, status);
      
      res.json({
        success: true,
        message: `Status updated to: ${status}`
      });
    } catch (error) {
      console.error('❌ Error updating status:', error);
      res.status(500).json({
        error: 'Failed to update status'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};