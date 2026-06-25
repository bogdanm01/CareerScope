import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { MeService } from '../services/me.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class MeController {
  constructor(@inject(TOKENS.meService) private meService: MeService) {}

  /**
   * Returns the authenticated user's profile details.
   *
   * The service loads the current user by session id and returns profile
   * fields, optional recruiter company context, and candidate skills when
   * present.
   *
   * @param req Express request containing the authenticated user.
   * @param res Express response returning the current user details.
   */
  async getMe(req: Request, res: Response) {
    const result = await this.meService.getMe(req.user);
    res.status(200).send(successResponse(result.data));
  }

  /**
   * Replaces skills for the authenticated candidate.
   *
   * The service validates the skill payload, rejects unknown skill ids, replaces
   * the candidate's existing skill set, and advances onboarding status when
   * appropriate.
   *
   * @param req Express request containing the replacement skill payload and authenticated candidate.
   * @param res Express response returning the persisted candidate skills.
   */
  async replaceCandidateSkills(req: Request, res: Response) {
    const result = await this.meService.replaceCandidateSkills(req.body, req.user);
    res.status(200).send(successResponse(result.data));
  }

  /**
   * Uploads a CV for the authenticated candidate.
   *
   * The service validates that a PDF file was uploaded, stores the new CV URL,
   * advances onboarding status, and removes the previous CV file when it has
   * been replaced.
   *
   * @param req Express request containing the uploaded CV file and authenticated candidate.
   * @param res Express response returning upload metadata and updated onboarding status.
   */
  async uploadCandidateCv(req: Request, res: Response) {
    const result = await this.meService.uploadCandidateCv(req.file, req.user);
    res.status(200).send(successResponse(result.data));
  }

  /**
   * Returns onboarding status for the authenticated user.
   *
   * The service loads the current user's onboarding status and fails when the
   * session user no longer exists in the database.
   *
   * @param req Express request containing the authenticated user.
   * @param res Express response returning the current onboarding status.
   */
  async getOnboardingStatus(req: Request, res: Response) {
    const result = await this.meService.getOnboardingStatus(req.user);
    res.status(200).send(successResponse(result.data));
  }

  /**
   * Downloads the authenticated candidate's CV.
   *
   * The service resolves the stored CV URL to a local upload path and rejects
   * the request when the candidate does not have a CV available.
   *
   * @param req Express request containing the authenticated candidate.
   * @param res Express response streaming the candidate CV file.
   */
  async downloadCandidateCv(req: Request, res: Response) {
    const result = await this.meService.getCandidateCv(req.user);
    res.download(result.filePath, result.fileName);
  }
}
