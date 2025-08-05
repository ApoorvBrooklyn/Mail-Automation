require('dotenv').config();
const trackingService = require('../../../services/trackingService');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      console.error('❌ No email provided for reply tracking');
      return res.status(400).send('Missing email parameter');
    }

    await trackingService.trackReplyClick(email);

    // Show a simple reply page
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reply to Consulting Cohort 101</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .success { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📧 Reply Sent Successfully!</h1>
          <p class="success">Your reply has been recorded and our team will get back to you soon.</p>
          <p>Thank you for your interest in Consulting Cohort 101!</p>
          <p><a href="mailto:${process.env.EMAIL_USER}">Click here to send an email directly</a></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error tracking reply click:', error);
    res.status(500).send('Error processing reply');
  }
};