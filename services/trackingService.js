const googleSheetsService = require('./googleSheetsService');

class TrackingService {
  constructor() {
    this.trackingData = new Map(); // In-memory storage for tracking data
  }

  // Track email opens via pixel
  async trackEmailOpen(email) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Only update if status is "Email Sent" or "Reminder X Sent"
      const validStatuses = ['Email Sent', 'Reminder 1 Sent', 'Reminder 2 Sent', 'Final Reminder Sent'];
      if (validStatuses.includes(submission.status)) {
        let newStatus = 'Email Opened';
        
        // If it was a reminder email, update to show it was opened
        if (submission.status === 'Reminder 1 Sent') {
          newStatus = 'Reminder 1 Opened';
        } else if (submission.status === 'Reminder 2 Sent') {
          newStatus = 'Reminder 2 Opened';
        } else if (submission.status === 'Final Reminder Sent') {
          newStatus = 'Final Reminder Opened';
        }

        await googleSheetsService.updateStatus(email, newStatus);
        console.log(`✅ Email open tracked for ${email}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to track email open:', error);
      return false;
    }
  }

  // Track link clicks
  async trackLinkClick(email, originalUrl) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Update status to show link was clicked
      await googleSheetsService.updateStatus(email, 'Link Clicked');
      
      // Store the original URL for redirection
      this.trackingData.set(email, {
        originalUrl,
        clickedAt: new Date().toISOString()
      });

      console.log(`✅ Link click tracked for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track link click:', error);
      return false;
    }
  }

  // Track reply clicks
  async trackReplyClick(email) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Update status to show user replied
      await googleSheetsService.updateStatus(email, 'Replied');
      console.log(`✅ Reply click tracked for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track reply click:', error);
      return false;
    }
  }

  // Track payment completion
  async trackPaymentSuccess(email) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Update status to show payment completed
      await googleSheetsService.updateStatus(email, 'Paid');
      console.log(`✅ Payment success tracked for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track payment success:', error);
      return false;
    }
  }

  // Track payment failure
  async trackPaymentFailure(email) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Update status to show payment failed
      await googleSheetsService.updateStatus(email, 'Payment Failed');
      console.log(`✅ Payment failure tracked for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track payment failure:', error);
      return false;
    }
  }

  // Get tracking data for an email
  getTrackingData(email) {
    return this.trackingData.get(email) || null;
  }

  // Check if user should receive follow-up emails
  async shouldReceiveFollowUp(email) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        return false;
      }

      // Don't send follow-ups if user has paid or replied
      const finalStatuses = ['Paid', 'Replied', 'Payment Failed'];
      return !finalStatuses.includes(submission.status);
    } catch (error) {
      console.error('❌ Failed to check follow-up eligibility:', error);
      return false;
    }
  }

  // Get users eligible for reminder 1 (unread for 2 days)
  async getUsersForReminder1() {
    try {
      const submissions = await googleSheetsService.getSubmissionsByStatus('Email Sent');
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      return submissions.filter(submission => {
        const submissionDate = new Date(submission.timestamp);
        return submissionDate < twoDaysAgo;
      });
    } catch (error) {
      console.error('❌ Failed to get users for reminder 1:', error);
      return [];
    }
  }

  // Get users eligible for reminder 2 (opened but not clicked)
  async getUsersForReminder2() {
    try {
      const openedStatuses = ['Email Opened', 'Reminder 1 Opened'];
      const submissions = await googleSheetsService.getAllSubmissions();
      
      return submissions.filter(submission => {
        return openedStatuses.includes(submission.status);
      });
    } catch (error) {
      console.error('❌ Failed to get users for reminder 2:', error);
      return [];
    }
  }

  // Get users eligible for final reminder (clicked but not paid within 2 days)
  async getUsersForFinalReminder() {
    try {
      const submissions = await googleSheetsService.getSubmissionsByStatus('Link Clicked');
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      return submissions.filter(submission => {
        const trackingData = this.getTrackingData(submission.email);
        if (!trackingData) return false;
        
        const clickDate = new Date(trackingData.clickedAt);
        return clickDate < twoDaysAgo;
      });
    } catch (error) {
      console.error('❌ Failed to get users for final reminder:', error);
      return [];
    }
  }
}

module.exports = new TrackingService(); 