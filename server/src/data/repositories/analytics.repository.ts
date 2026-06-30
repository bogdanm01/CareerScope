import { and, count, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { inject, injectable } from 'tsyringe';
import { DbClient } from '../../config/db-client.ts';
import { TOKENS } from '../../config/dependency-tokens.ts';
import { company } from '../schema/company.schema.ts';
import { jobApplication } from '../schema/job-application.schema.ts';
import { jobPosting } from '../schema/job-posting.schema.ts';
import skill from '../schema/skill.schema.ts';
import { user } from '../schema/auth.schema.ts';
import { userSkill } from '../schema/user-skill.schema.ts';
import { jobPostingSkill } from '../schema/job-posting-skill.schema.ts';
import { COMPANY_APPROVAL_STATUS, JOB_APPLICATION_STATUS, JOB_POSTING_STATUS, USER_ROLE } from '../util/constants.ts';

type DateRange = {
  from: Date;
  to: Date;
};

const dayExpression = (column: unknown) => sql<string>`to_char(date_trunc('day', ${column}), 'YYYY-MM-DD')`;

@injectable()
export class AnalyticsRepository {
  constructor(@inject(TOKENS.db) private db: DbClient) {}

  private getRangeConditions(column: unknown, range: DateRange): SQL[] {
    return [gte(column as never, range.from), lte(column as never, range.to)];
  }

  async getCandidateOverview(userId: string, range: DateRange) {
    const applicationConditions = [
      eq(jobApplication.userId, userId),
      eq(jobApplication.isDeleted, false),
      ...this.getRangeConditions(jobApplication.createdAt, range),
    ];

    const [[applicationStats], statusBreakdown, applicationsOverTime, [profileStats]] = await Promise.all([
      this.db
        .select({
          totalApplications: sql<number>`count(*)::int`,
          submittedApplications: sql<number>`count(*) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.SUBMITTED})::int`,
          underReviewApplications: sql<number>`count(*) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.UNDER_REVIEW})::int`,
          acceptedApplications: sql<number>`count(*) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.ACCEPTED})::int`,
          rejectedApplications: sql<number>`count(*) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.REJECTED})::int`,
        })
        .from(jobApplication)
        .where(and(...applicationConditions)),
      this.db
        .select({
          status: jobApplication.status,
          value: sql<number>`count(*)::int`,
        })
        .from(jobApplication)
        .where(and(...applicationConditions))
        .groupBy(jobApplication.status)
        .orderBy(jobApplication.status),
      this.db
        .select({
          date: dayExpression(jobApplication.createdAt),
          applications: sql<number>`count(*)::int`,
        })
        .from(jobApplication)
        .where(and(...applicationConditions))
        .groupBy(dayExpression(jobApplication.createdAt))
        .orderBy(dayExpression(jobApplication.createdAt)),
      this.db
        .select({
          selectedSkills: sql<number>`count(${userSkill.id})::int`,
          cvUploaded: sql<number>`case when max(${user.cvUrl}) is null then 0 else 1 end`,
          onboardingCompleted: sql<number>`case when max(${user.onboardingStatus}) = 'Completed' then 1 else 0 end`,
        })
        .from(user)
        .leftJoin(userSkill, eq(userSkill.userId, user.id))
        .where(eq(user.id, userId)),
    ]);

    return {
      stats: [
        { key: 'applications', label: 'Applications', value: applicationStats?.totalApplications ?? 0 },
        { key: 'underReview', label: 'Under review', value: applicationStats?.underReviewApplications ?? 0 },
        { key: 'accepted', label: 'Accepted', value: applicationStats?.acceptedApplications ?? 0 },
        { key: 'selectedSkills', label: 'Selected skills', value: profileStats?.selectedSkills ?? 0 },
        { key: 'cvUploaded', label: 'CV uploaded', value: profileStats?.cvUploaded ?? 0 },
        { key: 'profileCompleted', label: 'Profile completed', value: profileStats?.onboardingCompleted ?? 0 },
      ],
      charts: {
        applicationsByStatus: statusBreakdown,
        applicationsOverTime,
      },
    };
  }

  async getRecruiterOverview(companyId: number, range: DateRange) {
    const postingConditions = [
      eq(jobPosting.companyId, companyId),
      eq(jobPosting.isDeleted, false),
      ...this.getRangeConditions(jobPosting.createdAt, range),
    ];
    const applicationConditions = [
      eq(jobPosting.companyId, companyId),
      eq(jobPosting.isDeleted, false),
      eq(jobApplication.isDeleted, false),
      ...this.getRangeConditions(jobApplication.createdAt, range),
    ];

    const [
      [postingStats],
      [applicationStats],
      postingsByStatus,
      applicationsByStatus,
      applicationsOverTime,
      topPostings,
    ] = await Promise.all([
      this.db
        .select({
          totalPostings: sql<number>`count(*)::int`,
          activePostings: sql<number>`count(*) filter (where ${jobPosting.status} = ${JOB_POSTING_STATUS.ACTIVE})::int`,
          pendingPostings: sql<number>`count(*) filter (where ${jobPosting.status} = ${JOB_POSTING_STATUS.PENDING_APPROVAL})::int`,
        })
        .from(jobPosting)
        .where(and(...postingConditions)),
      this.db
        .select({
          totalApplications: sql<number>`count(${jobApplication.id})::int`,
          underReviewApplications: sql<number>`count(${jobApplication.id}) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.UNDER_REVIEW})::int`,
        })
        .from(jobApplication)
        .innerJoin(jobPosting, eq(jobPosting.id, jobApplication.jobPostingId))
        .where(and(...applicationConditions)),
      this.db
        .select({
          status: jobPosting.status,
          value: sql<number>`count(*)::int`,
        })
        .from(jobPosting)
        .where(and(...postingConditions))
        .groupBy(jobPosting.status)
        .orderBy(jobPosting.status),
      this.db
        .select({
          status: jobApplication.status,
          value: sql<number>`count(${jobApplication.id})::int`,
        })
        .from(jobApplication)
        .innerJoin(jobPosting, eq(jobPosting.id, jobApplication.jobPostingId))
        .where(and(...applicationConditions))
        .groupBy(jobApplication.status)
        .orderBy(jobApplication.status),
      this.db
        .select({
          date: dayExpression(jobApplication.createdAt),
          applications: sql<number>`count(${jobApplication.id})::int`,
        })
        .from(jobApplication)
        .innerJoin(jobPosting, eq(jobPosting.id, jobApplication.jobPostingId))
        .where(and(...applicationConditions))
        .groupBy(dayExpression(jobApplication.createdAt))
        .orderBy(dayExpression(jobApplication.createdAt)),
      this.db
        .select({
          id: jobPosting.id,
          title: jobPosting.title,
          applications: sql<number>`count(${jobApplication.id})::int`,
        })
        .from(jobPosting)
        .leftJoin(
          jobApplication,
          and(eq(jobApplication.jobPostingId, jobPosting.id), eq(jobApplication.isDeleted, false)),
        )
        .where(and(eq(jobPosting.companyId, companyId), eq(jobPosting.isDeleted, false)))
        .groupBy(jobPosting.id, jobPosting.title)
        .orderBy(desc(sql<number>`count(${jobApplication.id})`))
        .limit(5),
    ]);

    return {
      stats: [
        { key: 'postings', label: 'Postings', value: postingStats?.totalPostings ?? 0 },
        { key: 'activePostings', label: 'Active postings', value: postingStats?.activePostings ?? 0 },
        { key: 'pendingPostings', label: 'Pending postings', value: postingStats?.pendingPostings ?? 0 },
        { key: 'applications', label: 'Applications', value: applicationStats?.totalApplications ?? 0 },
        { key: 'underReview', label: 'Under review', value: applicationStats?.underReviewApplications ?? 0 },
      ],
      charts: {
        postingsByStatus,
        applicationsByStatus,
        applicationsOverTime,
        topPostings,
      },
    };
  }

  async getAdminOverview(range: DateRange) {
    const [
      [companyStats],
      [postingStats],
      [applicationStats],
      companiesByStatus,
      postingsByStatus,
      applicationsByStatus,
      applicationsOverTime,
      usersByRole,
      topSkillsByPostingDemand,
      topSkillsByCandidateSupply,
    ] = await Promise.all([
      this.db
        .select({
          totalCompanies: sql<number>`count(*) filter (where ${company.isDeleted} = false)::int`,
          pendingCompanies: sql<number>`count(*) filter (where ${company.approvalStatus} = ${COMPANY_APPROVAL_STATUS.PENDING_APPROVAL} and ${company.isDeleted} = false)::int`,
          approvedCompanies: sql<number>`count(*) filter (where ${company.approvalStatus} = ${COMPANY_APPROVAL_STATUS.APPROVED} and ${company.isDeleted} = false)::int`,
        })
        .from(company),
      this.db
        .select({
          totalPostings: sql<number>`count(*) filter (where ${jobPosting.isDeleted} = false)::int`,
          activePostings: sql<number>`count(*) filter (where ${jobPosting.status} = ${JOB_POSTING_STATUS.ACTIVE} and ${jobPosting.isDeleted} = false)::int`,
          pendingPostings: sql<number>`count(*) filter (where ${jobPosting.status} = ${JOB_POSTING_STATUS.PENDING_APPROVAL} and ${jobPosting.isDeleted} = false)::int`,
        })
        .from(jobPosting),
      this.db
        .select({
          totalApplications: sql<number>`count(*) filter (where ${jobApplication.isDeleted} = false)::int`,
          underReviewApplications: sql<number>`count(*) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.UNDER_REVIEW} and ${jobApplication.isDeleted} = false)::int`,
        })
        .from(jobApplication),
      this.db
        .select({
          status: company.approvalStatus,
          value: sql<number>`count(*)::int`,
        })
        .from(company)
        .where(eq(company.isDeleted, false))
        .groupBy(company.approvalStatus)
        .orderBy(company.approvalStatus),
      this.db
        .select({
          status: jobPosting.status,
          value: sql<number>`count(*)::int`,
        })
        .from(jobPosting)
        .where(eq(jobPosting.isDeleted, false))
        .groupBy(jobPosting.status)
        .orderBy(jobPosting.status),
      this.db
        .select({
          status: jobApplication.status,
          value: sql<number>`count(*)::int`,
        })
        .from(jobApplication)
        .where(eq(jobApplication.isDeleted, false))
        .groupBy(jobApplication.status)
        .orderBy(jobApplication.status),
      this.db
        .select({
          date: dayExpression(jobApplication.createdAt),
          applications: sql<number>`count(*)::int`,
        })
        .from(jobApplication)
        .where(and(eq(jobApplication.isDeleted, false), ...this.getRangeConditions(jobApplication.createdAt, range)))
        .groupBy(dayExpression(jobApplication.createdAt))
        .orderBy(dayExpression(jobApplication.createdAt)),
      this.db
        .select({
          role: user.role,
          value: sql<number>`count(*)::int`,
        })
        .from(user)
        .where(eq(user.isDeleted, false))
        .groupBy(user.role)
        .orderBy(user.role),
      this.db
        .select({
          skill: skill.name,
          value: sql<number>`count(${jobPostingSkill.id})::int`,
        })
        .from(jobPostingSkill)
        .innerJoin(skill, eq(skill.id, jobPostingSkill.skillId))
        .innerJoin(jobPosting, eq(jobPosting.id, jobPostingSkill.jobPostingId))
        .where(eq(jobPosting.isDeleted, false))
        .groupBy(skill.id, skill.name)
        .orderBy(desc(sql<number>`count(${jobPostingSkill.id})`))
        .limit(6),
      this.db
        .select({
          skill: skill.name,
          value: sql<number>`count(${userSkill.id})::int`,
        })
        .from(userSkill)
        .innerJoin(skill, eq(skill.id, userSkill.skillId))
        .innerJoin(user, eq(user.id, userSkill.userId))
        .where(and(eq(user.isDeleted, false), eq(user.role, USER_ROLE.CANDIDATE)))
        .groupBy(skill.id, skill.name)
        .orderBy(desc(sql<number>`count(${userSkill.id})`))
        .limit(6),
    ]);

    return {
      stats: [
        { key: 'companies', label: 'Total Companies', value: companyStats?.totalCompanies ?? 0 },
        { key: 'pendingCompanies', label: 'Pending Companies', value: companyStats?.pendingCompanies ?? 0 },
        { key: 'approvedCompanies', label: 'Approved Companies', value: companyStats?.approvedCompanies ?? 0 },
        { key: 'postings', label: 'Total Job Postings', value: postingStats?.totalPostings ?? 0 },
        { key: 'activePostings', label: 'Active Job Postings', value: postingStats?.activePostings ?? 0 },
        { key: 'pendingPostings', label: 'Pending Job Postings', value: postingStats?.pendingPostings ?? 0 },
        { key: 'applications', label: 'Total Job Applications', value: applicationStats?.totalApplications ?? 0 },
        {
          key: 'underReview',
          label: 'Applications Under Review',
          value: applicationStats?.underReviewApplications ?? 0,
        },
      ],
      charts: {
        companiesByStatus,
        postingsByStatus,
        applicationsByStatus,
        applicationsOverTime,
        usersByRole,
        topSkillsByPostingDemand,
        topSkillsByCandidateSupply,
      },
    };
  }
}
