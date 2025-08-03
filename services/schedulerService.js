const cron = require('cron');
const emailService = require('./emailService');
const trackingService = require('./trackingService');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  start() {
    console.log('🕐 Starting email scheduler...');

    // Run every 5 minutes to check for follow-up emails
    const followUpJob = new cron.CronJob('*/5 * * * *', async () => {
      console.log('⏰ Running scheduled follow-up check...');
      await this.processFollowUps();
    }, null, true, 'America/New_York');

    // Run every 5 minutes to check for final reminders
    const finalReminderJob = new cron.CronJob('*/5 * * * *', async () => {
      console.log('⏰ Running final reminder check...');
      await this.processFinalReminders();
    }, null, true, 'America/New_York');

    this.jobs.push(followUpJob, finalReminderJob);
    console.log('✅ Email scheduler started');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('🛑 Email scheduler stopped');
  }

  async processFollowUps() {
    try {
      // Process Reminder 1: Unread emails for 2+ days
      await this.processReminder1();

      // Process Reminder 2: Opened but not clicked
      await this.processReminder2();

    } catch (error) {
      console.error('❌ Error processing follow-ups:', error);
    }
  }

  async processFinalReminders() {
    try {
      await this.processFinalReminder();
    } catch (error) {
      console.error('❌ Error processing final reminders:', error);
    }
  }

  async processReminder1() {
    try {
      const usersForReminder1 = await trackingService.getUsersForReminder1();
      
      for (const user of usersForReminder1) {
        try {
          // Check if user should still receive follow-ups
          const shouldReceive = await trackingService.shouldReceiveFollowUp(user.email);
          if (!shouldReceive) {
            console.log(`⏭️ Skipping reminder 1 for ${user.email} - no longer eligible`);
            continue;
          }

          console.log(`📧 Sending reminder 1 to ${user.email}`);
          await emailService.sendReminderEmail1(user);
          
          // Add delay to avoid overwhelming email service
          await this.delay(1000);
        } catch (error) {
          console.error(`❌ Failed to send reminder 1 to ${user.email}:`, error);
        }
      }

      console.log(`✅ Processed ${usersForReminder1.length} reminder 1 emails`);
    } catch (error) {
      console.error('❌ Error processing reminder 1:', error);
    }
  }

  async processReminder2() {
    try {
      const usersForReminder2 = await trackingService.getUsersForReminder2();
      
      for (const user of usersForReminder2) {
        try {
          // Check if user should still receive follow-ups
          const shouldReceive = await trackingService.shouldReceiveFollowUp(user.email);
          if (!shouldReceive) {
            console.log(`⏭️ Skipping reminder 2 for ${user.email} - no longer eligible`);
            continue;
          }

          // Only send reminder 2 if they haven't received it yet
          if (!user.status.includes('Reminder 2')) {
            console.log(`📧 Sending reminder 2 to ${user.email}`);
            await emailService.sendReminderEmail2(user);
            
            // Add delay to avoid overwhelming email service
            await this.delay(1000);
          }
        } catch (error) {
          console.error(`❌ Failed to send reminder 2 to ${user.email}:`, error);
        }
      }

      console.log(`✅ Processed ${usersForReminder2.length} reminder 2 emails`);
    } catch (error) {
      console.error('❌ Error processing reminder 2:', error);
    }
  }

  async processFinalReminder() {
    try {
      const usersForFinalReminder = await trackingService.getUsersForFinalReminder();
      
      for (const user of usersForFinalReminder) {
        try {
          // Check if user should still receive follow-ups
          const shouldReceive = await trackingService.shouldReceiveFollowUp(user.email);
          if (!shouldReceive) {
            console.log(`⏭️ Skipping final reminder for ${user.email} - no longer eligible`);
            continue;
          }

          // Only send final reminder if they haven't received it yet
          if (!user.status.includes('Final Reminder')) {
            console.log(`📧 Sending final reminder to ${user.email}`);
            await emailService.sendFinalReminder(user);
            
            // Add delay to avoid overwhelming email service
            await this.delay(1000);
          }
        } catch (error) {
          console.error(`❌ Failed to send final reminder to ${user.email}:`, error);
        }
      }

      console.log(`✅ Processed ${usersForFinalReminder.length} final reminder emails`);
    } catch (error) {
      console.error('❌ Error processing final reminders:', error);
    }
  }

  // Utility function to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async triggerFollowUpCheck() {
    console.log('🔧 Manually triggering follow-up check...');
    await this.processFollowUps();
  }

  async triggerFinalReminderCheck() {
    console.log('🔧 Manually triggering final reminder check...');
    await this.processFinalReminders();
  }
}

module.exports = new SchedulerService(); 