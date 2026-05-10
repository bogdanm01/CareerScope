import cron from 'node-cron';
import logger from '../config/logger.ts';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { DbClient } from '../config/db-client.ts';
import { jobPosting } from '../data/schema/job-posting.schema.ts';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { JOB_POSTING_STATUS } from '../data/util/constants.ts';
import { jobPostingStatusHistory } from '../data/schema/job-posting-status-history.schema.ts';

export const registerExpireJobPostingsJob = () => {
  const cronExpression = '0 0 * * *';
  const timezone = 'UTC';
  const db = container.resolve<DbClient>(TOKENS.db);

  logger.info('CRON: Job registered: expire-job-postings');

  cron.schedule(
    cronExpression,
    async () => {
      try {
        logger.info('CRON: Running expire-job-postings job');
        const now = new Date();

        const expiredIds = await db.transaction(async (tx) => {
          const expirationFilter = and(
            eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE),
            eq(jobPosting.isDeleted, false),
            lte(jobPosting.expiresAt, now),
          );

          const jobPostingsToExpire = await tx.select({ id: jobPosting.id }).from(jobPosting).where(expirationFilter);
          const ids = jobPostingsToExpire.map((jobPosting) => jobPosting.id);

          if (ids.length === 0) {
            return [];
          }

          await tx
            .update(jobPosting)
            .set({ status: JOB_POSTING_STATUS.EXPIRED })
            .where(and(expirationFilter, inArray(jobPosting.id, ids)));

          await tx.insert(jobPostingStatusHistory).values(
            ids.map((id) => ({
              jobPostingId: id,
              status: JOB_POSTING_STATUS.EXPIRED,
              reason: 'Job posting expired automatically.',
            })),
          );

          return ids;
        });

        if (expiredIds.length > 0) {
          logger.info({ expiredCount: expiredIds.length }, 'CRON: Expired job postings');
        }
      } catch (error) {
        logger.error({ err: error }, 'Failed to expire job postings');
      }
    },
    {
      timezone,
    },
  );
};
