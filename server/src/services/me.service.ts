import { injectable } from 'tsyringe';
import { AuthenticatedUser } from '../data/util/utils.ts';

@injectable()
export class MeService {
  async addCandidateSkills(payload: unknown, user: AuthenticatedUser): Promise<void> {
    throw new Error('Not implemented.');
  }
}
