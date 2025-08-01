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

  // Track payment page visits (when users click payment links from emails)
  async trackPaymentPageVisit(email, metadata = {}) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Update status to show user visited payment page (clicked payment link)
      await googleSheetsService.updateStatus(email, 'Payment Link Clicked');
      
      // Store additional metadata for analytics
      this.trackingData.set(`${email}_payment_visit`, {
        visitedAt: metadata.timestamp || new Date().toISOString(),
        trackingId: metadata.trackingId,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer
      });

      console.log(`✅ Payment page visit tracked for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track payment page visit:', error);
      return false;
    }
  }

  // Track payment abandonment (users who visited but didn't complete payment)
  async trackPaymentAbandonment(email, metadata = {}) {
    try {
      const submission = await googleSheetsService.getSubmissionByEmail(email);
      if (!submission) {
        console.error(`❌ No submission found for email: ${email}`);
        return false;
      }

      // Only track abandonment if they haven't paid yet
      if (submission.status === 'Paid') {
        console.log(`⏭️ Skipping abandonment for ${email} - already paid`);
        return false;
      }

      // Update status to show payment was abandoned
      await googleSheetsService.updateStatus(email, 'Payment Abandoned');
      
      // Store abandonment data for analytics
      this.trackingData.set(`${email}_payment_abandonment`, {
        abandonedAt: metadata.timestamp || new Date().toISOString(),
        timeOnPage: metadata.timeOnPage || 0
      });

      console.log(`✅ Payment abandonment tracked for ${email} (${metadata.timeOnPage}s on page)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to track payment abandonment:', error);
      return false;
    }
  }

  // Check submission status (helper method for tracking)
  async checkSubmissionStatus(email) {
    try {
      return await googleSheetsService.getSubmissionByEmail(email);
    } catch (error) {
      console.error('❌ Failed to check submission status:', error);
      return null;
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
        console.log(`❌ No submission found for ${email}`);
        return false;
      }

      // Don't send follow-ups if user has paid or replied (but DO send to Payment Failed users)
      const finalStatuses = ['Paid', 'Replied'];
      const shouldReceive = !finalStatuses.includes(submission.status);
      
      console.log(`🔍 Follow-up eligibility for ${email}: Status=${submission.status}, ShouldReceive=${shouldReceive}`);
      return shouldReceive;
    } catch (error) {
      console.error('❌ Failed to check follow-up eligibility:', error);
      return false;
    }
  }

  // Get users eligible for reminder 1 (unread emails - reduced time for demo)
  async getUsersForReminder1() {
    try {
      const submissions = await googleSheetsService.getSubmissionsByStatus('Email Sent');
      const timeAgo = new Date();
      timeAgo.setMinutes(timeAgo.getMinutes() - 5); // Changed from 2 days to 5 minutes for demo
      
      console.log(`🔍 Checking ${submissions.length} users with 'Email Sent' status for Reminder 1`);
      
      const eligible = submissions.filter(submission => {
        const submissionDate = new Date(submission.timestamp);
        const isOldEnough = submissionDate < timeAgo;
        console.log(`📋 ${submission.email}: Submitted ${submissionDate.toISOString()}, Eligible: ${isOldEnough}`);
        return isOldEnough;
      });
      
      console.log(`✅ Found ${eligible.length} users eligible for Reminder 1`);
      return eligible;
    } catch (error) {
      console.error('❌ Failed to get users for reminder 1:', error);
      return [];
    }
  }

  // Get users eligible for reminder 2 (opened but not clicked, or payment failed)
  async getUsersForReminder2() {
    try {
      const eligibleStatuses = ['Email Opened', 'Reminder 1 Opened', 'Payment Failed', 'Payment Abandoned'];
      const submissions = await googleSheetsService.getAllSubmissions();
      
      console.log(`🔍 Checking all users for Reminder 2 eligibility`);
      
      const eligible = submissions.filter(submission => {
        const isEligible = eligibleStatuses.includes(submission.status);
        console.log(`📋 ${submission.email}: Status=${submission.status}, Eligible: ${isEligible}`);
        return isEligible;
      });
      
      console.log(`✅ Found ${eligible.length} users eligible for Reminder 2`);
      return eligible;
    } catch (error) {
      console.error('❌ Failed to get users for reminder 2:', error);
      return [];
    }
  }

  // Get users eligible for final reminder (clicked payment link but not paid within 2 days)
  async getUsersForFinalReminder() {
    try {
      // Get users who clicked payment link or abandoned payment
      const paymentLinkClicked = await googleSheetsService.getSubmissionsByStatus('Payment Link Clicked');
      const paymentAbandoned = await googleSheetsService.getSubmissionsByStatus('Payment Abandoned');
      
      const allCandidates = [...paymentLinkClicked, ...paymentAbandoned];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      return allCandidates.filter(submission => {
        const submissionDate = new Date(submission.timestamp);
        return submissionDate < twoDaysAgo;
      });
    } catch (error) {
      console.error('❌ Failed to get users for final reminder:', error);
      return [];
    }
  }

  // Get payment analytics data
  async getPaymentAnalytics() {
    try {
      const allSubmissions = await googleSheetsService.getAllSubmissions();
      
      const analytics = {
        totalSubmissions: allSubmissions.length,
        emailsSent: 0,
        paymentLinksClicked: 0,
        paymentsCompleted: 0,
        paymentsAbandoned: 0,
        paymentsFailed: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        abandonmentRate: 0
      };

      // Count statuses
      allSubmissions.forEach(submission => {
        switch (submission.status) {
          case 'Email Sent':
          case 'Email Opened':
          case 'Reminder 1 Sent':
          case 'Reminder 2 Sent':
          case 'Final Reminder Sent':
            analytics.emailsSent++;
            break;
          case 'Payment Link Clicked':
            analytics.paymentLinksClicked++;
            break;
          case 'Paid':
            analytics.paymentsCompleted++;
            break;
          case 'Payment Abandoned':
            analytics.paymentsAbandoned++;
            break;
          case 'Payment Failed':
            analytics.paymentsFailed++;
            break;
        }
      });

      // Calculate rates
      if (analytics.emailsSent > 0) {
        analytics.clickThroughRate = Math.round((analytics.paymentLinksClicked / analytics.emailsSent) * 100);
      }
      
      const totalPaymentAttempts = analytics.paymentLinksClicked + analytics.paymentsAbandoned;
      if (totalPaymentAttempts > 0) {
        analytics.conversionRate = Math.round((analytics.paymentsCompleted / totalPaymentAttempts) * 100);
        analytics.abandonmentRate = Math.round((analytics.paymentsAbandoned / totalPaymentAttempts) * 100);
      }

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get payment analytics:', error);
      return null;
    }
  }
}

module.exports = new TrackingService(); 