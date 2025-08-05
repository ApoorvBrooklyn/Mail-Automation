require('dotenv').config();
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
    const reminder1Users = await trackingService.getUsersForReminder1();
    const reminder2Users = await trackingService.getUsersForReminder2();
    const finalReminderUsers = await trackingService.getUsersForFinalReminder();

    res.json({
      success: true,
      data: {
        reminder1: {
          count: reminder1Users.length,
          users: reminder1Users
        },
        reminder2: {
          count: reminder2Users.length,
          users: reminder2Users
        },
        finalReminder: {
          count: finalReminderUsers.length,
          users: finalReminderUsers
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching follow-up data:', error);
    res.status(500).json({
      error: 'Failed to fetch follow-up data'
    });
  }
};