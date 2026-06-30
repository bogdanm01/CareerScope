import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AdminService } from '../services/admin.service.ts';
import { successResponse } from '../lib/api-response.ts';

@injectable()
export class AdminController {
  constructor(@inject(TOKENS.adminService) private adminService: AdminService) {}

  async getCompany(req: Request, res: Response) {
    const result = await this.adminService.getCompany(req.params.id);
    res.status(200).send(successResponse(result.data));
  }

  async getCompanies(req: Request, res: Response) {
    const result = await this.adminService.getCompanies(req.query);
    res.status(200).send(successResponse(result.data, undefined, result.pagination));
  }
}
