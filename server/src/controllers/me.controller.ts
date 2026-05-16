import { injectable } from 'tsyringe';

@injectable()
export class MeController {
  constructor() {}

  async addCandidateSkills(req: Request, res: Response) {
    throw Error('Not implemented');
  }
}
