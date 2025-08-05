require('dotenv').config();
const googleSheetsService = require('../../services/googleSheetsService');
const trackingService = require('../../services/trackingService');

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
    const allSubmissions = await googleSheetsService.getAllSubmissions();
    
    // Calculate basic statistics
    const stats = {
      total: allSubmissions.length,
      byStatus: {},
      conversionRate: 0,
      recentActivity: []
    };

    // Count by status
    allSubmissions.forEach(submission => {
      const status = submission.status || 'Unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    // Calculate conversion rate (Paid / Total)
    const paidCount = stats.byStatus['Paid'] || 0;
    stats.conversionRate = allSubmissions.length > 0 ? 
      Math.round((paidCount / allSubmissions.length) * 100) : 0;

    // Get recent activity (last 10 submissions)
    stats.recentActivity = allSubmissions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Get payment analytics
    try {
      const paymentAnalytics = await trackingService.getPaymentAnalytics();
      if (paymentAnalytics) {
        stats.paymentAnalytics = paymentAnalytics;
      }
    } catch (error) {
      console.warn('Payment analytics warning:', error.message);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
};