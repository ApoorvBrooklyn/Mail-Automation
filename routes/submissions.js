const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const emailService = require('../services/emailService');

// Submit interest form
router.post('/', async (req, res) => {
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
});

// Get all submissions (admin only)
router.get('/', async (req, res) => {
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
});

// Get submission by email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
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
});

// Update submission status (admin only)
router.patch('/:email/status', async (req, res) => {
  try {
    const { email } = req.params;
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
});

module.exports = router; 