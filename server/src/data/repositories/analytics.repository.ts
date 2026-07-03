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

  async getRecruiterOverview(companyId: number, range: DateRange, view: 'overview' | 'postings' = 'overview') {
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
      postingPerformance,
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
      view === 'postings'
        ? this.db
          .select({
            id: jobPosting.id,
            title: jobPosting.title,
            status: jobPosting.status,
            expiresAt: sql<string | null>`to_char(${jobPosting.expiresAt}, 'YYYY-MM-DD')`,
            applications: sql<number>`count(${jobApplication.id})::int`,
            underReview: sql<number>`count(${jobApplication.id}) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.UNDER_REVIEW})::int`,
            accepted: sql<number>`count(${jobApplication.id}) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.ACCEPTED})::int`,
            rejected: sql<number>`count(${jobApplication.id}) filter (where ${jobApplication.status} = ${JOB_APPLICATION_STATUS.REJECTED})::int`,
          })
          .from(jobPosting)
          .leftJoin(
            jobApplication,
            and(
              eq(jobApplication.jobPostingId, jobPosting.id),
              eq(jobApplication.isDeleted, false),
              ...this.getRangeConditions(jobApplication.createdAt, range),
            ),
          )
          .where(and(eq(jobPosting.companyId, companyId), eq(jobPosting.isDeleted, false)))
          .groupBy(jobPosting.id, jobPosting.title, jobPosting.status, jobPosting.expiresAt)
          .orderBy(desc(sql<number>`count(${jobApplication.id})`), desc(jobPosting.createdAt))
        : Promise.resolve([]),
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
        postingPerformance,
      },
    };
  }

  async getRecruiterJobPostingOverview(companyId: number, jobPostingId: number, range: DateRange) {
    const [posting] = await this.db
      .select({
        id: jobPosting.id,
        title: jobPosting.title,
        status: jobPosting.status,
        workLocation: jobPosting.workLocation,
        employmentType: jobPosting.employmentType,
        salaryRange: jobPosting.salaryRange,
        expiresAt: sql<string | null>`to_char(${jobPosting.expiresAt}, 'YYYY-MM-DD')`,
      })
      .from(jobPosting)
      .where(and(
        eq(jobPosting.id, jobPostingId),
        eq(jobPosting.companyId, companyId),
        eq(jobPosting.isDeleted, false),
      ));

    if (!posting) {
      return null;
    }

    const applicationConditions = [
      eq(jobApplication.jobPostingId, jobPostingId),
      eq(jobApplication.isDeleted, false),
      ...this.getRangeConditions(jobApplication.createdAt, range),
    ];

    const [[applicationStats], applicationsByStatus, applicationsOverTime, requiredSkills] = await Promise.all([
      this.db
        .select({
          totalApplications: sql<number>`count(*)::int`,
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
          skill: skill.name,
          yoe: jobPostingSkill.yoe,
          value: sql<number>`coalesce(${jobPostingSkill.yoe}, 0)::int`,
        })
        .from(jobPostingSkill)
        .innerJoin(skill, eq(skill.id, jobPostingSkill.skillId))
        .where(eq(jobPostingSkill.jobPostingId, jobPostingId))
        .orderBy(skill.name),
    ]);

    return {
      jobPosting: posting,
      stats: [
        { key: 'applications', label: 'Applications', value: applicationStats?.totalApplications ?? 0 },
        { key: 'underReview', label: 'Under review', value: applicationStats?.underReviewApplications ?? 0 },
        { key: 'accepted', label: 'Accepted', value: applicationStats?.acceptedApplications ?? 0 },
        { key: 'rejected', label: 'Rejected', value: applicationStats?.rejectedApplications ?? 0 },
      ],
      charts: {
        applicationsByStatus,
        applicationsOverTime,
        requiredSkills,
      },
    };
  }

  async getAdminOverview(range: DateRange) {
    const reviewDays = sql<number>`extract(epoch from (${jobApplication.updatedAt} - ${jobApplication.createdAt})) / 86400`;
    const reviewSpeedBucket = sql<string>`case
      when ${reviewDays} < 1 then 'Same day'
      when ${reviewDays} < 4 then '1-3 days'
      when ${reviewDays} < 8 then '4-7 days'
      else '8+ days'
    end`;
    const reviewSpeedSort = sql<number>`case
      when ${reviewDays} < 1 then 1
      when ${reviewDays} < 4 then 2
      when ${reviewDays} < 8 then 3
      else 4
    end`;
    const skillDemand = sql<number>`count(distinct ${jobPosting.id})`;
    const skillSupply = sql<number>`count(distinct ${user.id})`;

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
      applicationsPerCompany,
      applicationReviewSpeed,
      skillDemandSupplyGap,
      activeJobsByWorkLocation,
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
        .limit(10),
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
        .limit(10),
      this.db
        .select({
          company: company.name,
          value: sql<number>`count(${jobApplication.id})::int`,
        })
        .from(jobApplication)
        .innerJoin(jobPosting, eq(jobPosting.id, jobApplication.jobPostingId))
        .innerJoin(company, eq(company.id, jobPosting.companyId))
        .where(and(
          eq(jobApplication.isDeleted, false),
          eq(jobPosting.isDeleted, false),
          eq(company.isDeleted, false),
          ...this.getRangeConditions(jobApplication.createdAt, range),
        ))
        .groupBy(company.id, company.name)
        .orderBy(desc(sql<number>`count(${jobApplication.id})`))
        .limit(10),
      this.db
        .select({
          bucket: reviewSpeedBucket,
          sort: reviewSpeedSort,
          value: sql<number>`count(${jobApplication.id})::int`,
        })
        .from(jobApplication)
        .where(and(
          eq(jobApplication.isDeleted, false),
          sql`${jobApplication.status} <> ${JOB_APPLICATION_STATUS.SUBMITTED}`,
          ...this.getRangeConditions(jobApplication.createdAt, range),
        ))
        .groupBy(reviewSpeedBucket, reviewSpeedSort)
        .orderBy(reviewSpeedSort),
      this.db
        .select({
          skill: skill.name,
          demand: sql<number>`${skillDemand}::int`,
          supply: sql<number>`${skillSupply}::int`,
          value: sql<number>`(${skillSupply} - ${skillDemand})::int`,
        })
        .from(skill)
        .leftJoin(jobPostingSkill, eq(jobPostingSkill.skillId, skill.id))
        .leftJoin(
          jobPosting,
          and(
            eq(jobPosting.id, jobPostingSkill.jobPostingId),
            eq(jobPosting.isDeleted, false),
          ),
        )
        .leftJoin(userSkill, eq(userSkill.skillId, skill.id))
        .leftJoin(
          user,
          and(
            eq(user.id, userSkill.userId),
            eq(user.isDeleted, false),
            eq(user.role, USER_ROLE.CANDIDATE),
          ),
        )
        .groupBy(skill.id, skill.name)
        .orderBy(desc(sql<number>`abs(${skillSupply} - ${skillDemand})`))
        .limit(20),
      this.db
        .select({
          location: jobPosting.workLocation,
          value: sql<number>`count(*)::int`,
        })
        .from(jobPosting)
        .where(and(
          eq(jobPosting.isDeleted, false),
          eq(jobPosting.status, JOB_POSTING_STATUS.ACTIVE),
        ))
        .groupBy(jobPosting.workLocation)
        .orderBy(desc(sql<number>`count(*)`)),
    ]);

    return {
      stats: [
        { key: 'companies', label: 'Companies', value: companyStats?.totalCompanies ?? 0 },
        { key: 'pendingCompanies', label: 'Pending companies', value: companyStats?.pendingCompanies ?? 0 },
        { key: 'approvedCompanies', label: 'Approved companies', value: companyStats?.approvedCompanies ?? 0 },
        { key: 'postings', label: 'Postings', value: postingStats?.totalPostings ?? 0 },
        { key: 'activePostings', label: 'Active postings', value: postingStats?.activePostings ?? 0 },
        { key: 'pendingPostings', label: 'Pending postings', value: postingStats?.pendingPostings ?? 0 },
        { key: 'applications', label: 'Applications', value: applicationStats?.totalApplications ?? 0 },
        {
          key: 'underReview',
          label: 'Under review',
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
        applicationsPerCompany,
        applicationReviewSpeed,
        skillDemandSupplyGap,
        activeJobsByWorkLocation,
      },
    };
  }
}
