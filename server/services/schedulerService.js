const cron = require('node-cron');
const PayoutService = require('./payoutService');

// Get schedule from environment variable or use default (Every Monday at 1 AM)
const PAYOUT_SCHEDULE = process.env.PAYOUT_SCHEDULE || '0 1 * * 1';

class SchedulerService {
  static initializeScheduledTasks() {
    // Validate cron expression
    if (!cron.validate(PAYOUT_SCHEDULE)) {
      console.error('Invalid PAYOUT_SCHEDULE cron expression:', PAYOUT_SCHEDULE);
      console.log('Using default schedule: Every Monday at 1 AM (0 1 * * 1)');
    }

    // Schedule automatic payouts
    cron.schedule(PAYOUT_SCHEDULE, async () => {
      console.log('Running scheduled payouts...');
      try {
        await PayoutService.processPayouts();
        console.log('Scheduled payouts completed successfully');
      } catch (error) {
        console.error('Error in scheduled payouts:', error);
      }
    });

    console.log(`Scheduled tasks initialized with payout schedule: ${PAYOUT_SCHEDULE}`);
  }
}

module.exports = SchedulerService; 