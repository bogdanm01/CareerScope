import { inject, injectable } from 'tsyringe';
import { AuthenticatedUser } from '../data/util/utils.ts';
import { AddCandidateSkillsRequestSchema } from '../lib/zod/user.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SingleResult } from '../lib/api-response.ts';
import { UserSkill } from '../data/schema/user-skill.schema.ts';
import { SkillRepository } from '../data/repositories/skill.repository.ts';
import skill from '../data/schema/skill.schema.ts';
import { inArray } from 'drizzle-orm';
import { BadRequestError } from '../lib/app-error.ts';
import { ONBOARDING_STATUS } from '../data/util/constants.ts';
import { deleteCvFile, toCvUrl } from '../middleware/cv-upload.middleware.ts';

type CandidateCvUploadPlaceholder = {
  fileName: string;
  mimeType: string;
  size: number;
  cvUrl: string;
  onboardingStatus: string;
};

@injectable()
export class MeService {
  constructor(
    @inject(TOKENS.userRepository) private readonly userRepository: UserRepository,
    @inject(TOKENS.skillRepository) private readonly skillRepository: SkillRepository,
  ) {}

  async replaceCandidateSkills(payload: unknown, user: AuthenticatedUser): Promise<SingleResult<UserSkill[]>> {
    const validationResult = AddCandidateSkillsRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const skills = validationResult.data.skills;

    const existingSkillIds: number[] = (
      await this.skillRepository.find(
        { id: skill.id },
        inArray(
          skill.id,
          skills.map((s) => s.id),
        ),
      )
    ).data.map((skill) => skill.id);

    const missingSkillIds = skills.filter((skill) => !existingSkillIds.includes(skill.id)).map((skill) => skill.id);

    if (missingSkillIds.length > 0) {
      throw new BadRequestError(`Invalid skill ids: ${missingSkillIds.join(', ')}`);
    }

    const mappedSkills = validationResult.data.skills.map((skill) => ({
      skillId: skill.id,
      userId: user.id,
      yearsOfExperience: skill.yearsOfExperience,
    }));

    const newSkills = await this.userRepository.replaceUserSkills(
      user.id,
      mappedSkills,
      ONBOARDING_STATUS.SKILLS_ADDED,
    );

    return {
      data: newSkills,
    };
  }

  async uploadCandidateCv(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
  ): Promise<SingleResult<CandidateCvUploadPlaceholder>> {
    if (!file) {
      throw new BadRequestError('CV file is required.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestError('CV file must be a PDF.');
    }

    const cvUrl = toCvUrl(file.filename);
    const previousCvUrl = await this.userRepository.findCvUrl(user.id);
    const updatedUser = await this.userRepository.updateCandidateCv(user.id, cvUrl, ONBOARDING_STATUS.CV_UPLOADED);

    if (previousCvUrl && previousCvUrl !== cvUrl) {
      await deleteCvFile(previousCvUrl);
    }

    return {
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        cvUrl,
        onboardingStatus: updatedUser.onboardingStatus,
      },
    };
  }
}
