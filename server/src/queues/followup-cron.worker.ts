/**
 * Follow-Up Radar BullMQ Cron Worker
 * Daily recurring worker that identifies dormant threads (4/8/14 days without reply),
 * triggers notifications, and tracks candidates.
 */
import { Worker } from 'bullmq';
import { prisma, ApplicationStatus } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions } from '../config/bullmq.js';

export function initFollowUpCronWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.FOLLOW_UP,
    async () => {
      const now = new Date();

      // 1. Find all pending applications across all active users where follow-up date has arrived
      const pendingFollowUps = await prisma.application.findMany({
        where: {
          isArchived: false,
          hasReply: false,
          nextFollowUpDate: { lte: now },
          status: {
            notIn: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED, ApplicationStatus.GHOSTED]
          }
        },
        select: {
          id: true,
          userId: true,
          companyName: true,
          roleTitle: true,
          followUpCount: true,
          nextFollowUpDate: true
        }
      });

      console.log(`[Follow-Up Radar] Found ${pendingFollowUps.length} applications needing follow-up.`);

      // 2. Scan for upcoming OA and Interview deadlines (within the next 24 hours)
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const upcomingDeadlines = await prisma.application.findMany({
        where: {
          isArchived: false,
          stageDueDate: {
            gt: now,
            lte: in24Hours
          },
          status: {
            in: [ApplicationStatus.OA_TEST, ApplicationStatus.INTERVIEW]
          }
        },
        select: {
          id: true,
          userId: true,
          companyName: true,
          roleTitle: true,
          status: true,
          stageDueDate: true
        }
      });

      console.log(`[Deadline Radar] Found ${upcomingDeadlines.length} upcoming OA/Interview deadlines.`);

      // Dispatch Web Push notification for each upcoming deadline
      const { notificationsService } = await import('../modules/notifications/notifications.service.js');
      const { cryptoService } = await import('../services/crypto.service.js');

      for (const item of upcomingDeadlines) {
        if (!item.stageDueDate) continue;

        const company = cryptoService.safeDecrypt(item.companyName) || item.companyName;
        const role = cryptoService.safeDecrypt(item.roleTitle) || item.roleTitle;
        const hoursLeft = Math.max(1, Math.round((item.stageDueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

        const isUrgent = hoursLeft <= 6;
        const title = isUrgent
          ? `🚨 Urgent: ${item.status === 'INTERVIEW' ? 'Interview' : 'OA'} in ${hoursLeft}h (${company})`
          : `⏰ Reminder: ${item.status === 'INTERVIEW' ? 'Interview' : 'OA Due'} tomorrow (${company})`;

        const body = `${role} at ${company} is scheduled / due in ${hoursLeft} hours. Click to view notes and preparation details.`;

        await notificationsService.sendPushToUser(item.userId, {
          title,
          body,
          url: '/',
          tag: `deadline-${item.id}`
        });
      }

      return {
        scannedFollowUps: pendingFollowUps.length,
        scannedDeadlines: upcomingDeadlines.length
      };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 1
    }
  );

  return worker;
}

export default initFollowUpCronWorker;
