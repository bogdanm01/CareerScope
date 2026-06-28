import { inject, injectable } from 'tsyringe';
import { AuthenticatedUser } from '../data/util/utils.ts';
import { AddCandidateSkillsRequestSchema, UpdateProfileRequestSchema } from '../lib/zod/user.zod-schema.ts';
import { ZodValidationError } from '../lib/zod-validation-error.ts';
import { MeUserDetails, UserRepository } from '../data/repositories/user.repository.ts';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SingleResult } from '../lib/api-response.ts';
import { UserSkill } from '../data/schema/user-skill.schema.ts';
import { SkillRepository } from '../data/repositories/skill.repository.ts';
import { BadRequestError, NotFoundError } from '../lib/app-error.ts';
import { ONBOARDING_STATUS } from '../data/util/constants.ts';
import { deleteCvFile, resolveCvFilePath, toCvUrl } from '../middleware/cv-upload.middleware.ts';
import { deleteProfileImageFile, toProfileImageUrl } from '../middleware/profile-image-upload.middleware.ts';

type CandidateCvUploadPlaceholder = {
  fileName: string;
  mimeType: string;
  size: number;
  cvUrl: string;
  onboardingStatus: string;
};

type OnboardingStatusResponse = {
  onboardingStatus: string;
};

type CandidateCvDownload = {
  filePath: string;
  fileName: string;
};

type ProfileUpdateResponse = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  image: string | null;
};

@injectable()
export class MeService {
  constructor(
    @inject(TOKENS.userRepository) private readonly userRepository: UserRepository,
    @inject(TOKENS.skillRepository) private readonly skillRepository: SkillRepository,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<SingleResult<MeUserDetails>> {
    const record = await this.userRepository.findMeById(user.id);

    if (!record) {
      throw new NotFoundError('User not found.');
    }

    return {
      data: record,
    };
  }

  async updateProfile(payload: unknown, user: AuthenticatedUser): Promise<SingleResult<ProfileUpdateResponse>> {
    const validationResult = UpdateProfileRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const firstName = validationResult.data.firstName;
    const lastName = validationResult.data.lastName;
    const updatedUser = await this.userRepository.updateProfile(user.id, {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
    });

    if (!updatedUser) {
      throw new NotFoundError('User not found.');
    }

    return {
      data: updatedUser,
    };
  }

  async uploadProfilePicture(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
  ): Promise<SingleResult<ProfileUpdateResponse>> {
    if (!file) {
      throw new BadRequestError('Profile picture is required.');
    }

    const imageUrl = toProfileImageUrl(file.filename);
    const previousImageUrl = await this.userRepository.findImageUrl(user.id);
    const updatedUser = await this.userRepository.updateProfileImage(user.id, imageUrl);

    if (!updatedUser) {
      throw new NotFoundError('User not found.');
    }

    if (previousImageUrl && previousImageUrl !== imageUrl) {
      await deleteProfileImageFile(previousImageUrl);
    }

    return {
      data: updatedUser,
    };
  }

  async replaceCandidateSkills(payload: unknown, user: AuthenticatedUser): Promise<SingleResult<UserSkill[]>> {
    const validationResult = AddCandidateSkillsRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      throw new ZodValidationError(validationResult.error);
    }

    const skills = validationResult.data.skills;
    const skillIds = skills.map((s) => s.id);
    const skillRequirements = await this.skillRepository.findSkillRequirements(skillIds);

    const skillRequirementById = new Map(skillRequirements.map((skill) => [skill.id, skill]));
    const missingSkillIds = skills.filter((skill) => !skillRequirementById.has(skill.id)).map((skill) => skill.id);

    if (missingSkillIds.length > 0) {
      throw new BadRequestError(`Invalid skill ids: ${missingSkillIds.join(', ')}`);
    }

    const missingYoeSkillIds = skills
      .filter((item) => skillRequirementById.get(item.id)?.requiresYearsOfExperience && item.yearsOfExperience == null)
      .map((item) => item.id);

    if (missingYoeSkillIds.length > 0) {
      throw new BadRequestError(`Years of experience is required for skill ids: ${missingYoeSkillIds.join(', ')}`);
    }

    const mappedSkills = validationResult.data.skills.map((skill) => ({
      skillId: skill.id,
      userId: user.id,
      yearsOfExperience: skillRequirementById.get(skill.id)?.requiresYearsOfExperience ? skill.yearsOfExperience : null,
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
    const updatedUser = await this.userRepository.updateCandidateCv(user.id, cvUrl, ONBOARDING_STATUS.COMPLETED);

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

  async getOnboardingStatus(user: AuthenticatedUser): Promise<SingleResult<OnboardingStatusResponse>> {
    const onboardingStatus = await this.userRepository.findOnboardingStatus(user.id);

    if (!onboardingStatus) {
      throw new NotFoundError('User not found.');
    }

    return {
      data: {
        onboardingStatus,
      },
    };
  }

  async getCandidateCv(user: AuthenticatedUser): Promise<CandidateCvDownload> {
    const cvUrl = await this.userRepository.findCvUrl(user.id);
    const filePath = resolveCvFilePath(cvUrl);

    if (!filePath) {
      throw new NotFoundError('CV not found.');
    }

    return {
      filePath,
      fileName: 'candidate-cv.pdf',
    };
  }
}
