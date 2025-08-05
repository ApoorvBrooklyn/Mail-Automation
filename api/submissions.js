require('dotenv').config();
const googleSheetsService = require('../services/googleSheetsService');
const emailService = require('../services/emailService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize services if not already initialized
    if (!googleSheetsService.isInitialized) {
      await googleSheetsService.initialize();
    }
    if (!emailService.isInitialized) {
      await emailService.initialize();
    }
  } catch (error) {
    console.warn('Service initialization warning:', error.message);
  }

  // Parse the request path to determine the route
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Routes:
  // /api/submissions -> submissions operations
  // /api/submissions/email@example.com -> specific submission operations

  if (pathParts.length === 2 && pathParts[1] === 'submissions') {
    // Handle /api/submissions
    if (req.method === 'POST') {
      // Submit interest form
      try {
        const { name, email, phone } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['name', 'email', 'phone']
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            error: 'Invalid email format'
          });
        }

        // Check if email already exists
        const existingSubmission = await googleSheetsService.getSubmissionByEmail(email);
        if (existingSubmission) {
          return res.status(409).json({
            error: 'Email already registered',
            message: 'This email address has already been registered for the program.'
          });
        }

        // Create submission object
        const submission = {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim()
        };

        // Store in Google Sheets
        const result = await googleSheetsService.addSubmission(submission);

        // Send confirmation email
        await emailService.sendConfirmationEmail(submission);

        console.log(`✅ New submission processed: ${submission.email}`);

        res.status(201).json({
          success: true,
          message: 'Registration successful! Please check your email for next steps.',
          data: {
            name: submission.name,
            email: submission.email,
            timestamp: result.timestamp
          }
        });

      } catch (error) {
        console.error('❌ Error processing submission:', error);
        res.status(500).json({
          error: 'Failed to process submission',
          message: 'Please try again later or contact support.'
        });
      }
    } else if (req.method === 'GET') {
      // Get all submissions (admin only)
      try {
        const submissions = await googleSheetsService.getAllSubmissions();
        res.json({
          success: true,
          count: submissions.length,
          data: submissions
        });
      } catch (error) {
        console.error('❌ Error fetching submissions:', error);
        res.status(500).json({
          error: 'Failed to fetch submissions'
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (pathParts.length === 3 && pathParts[1] === 'submissions') {
    // Handle /api/submissions/[email]
    const email = decodeURIComponent(pathParts[2]);

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
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
};