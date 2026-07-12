import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TOKENS } from '../config/dependency-tokens.ts';
import { AdminService } from '../services/admin.service.ts';
import { successResponse } from '../lib/api-response.ts';
import { UnauthorizedError } from '../lib/app-error.ts';

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

  async getUsers(req: Request, res: Response) {
    const result = await this.adminService.getUsers(req.query);
    res.status(200).send(successResponse(result.data, undefined, result.pagination));
  }

  async getUser(req: Request, res: Response) {
    const result = await this.adminService.getUser(req.params.id);
    res.status(200).send(successResponse(result.data));
  }

  async updateUser(req: Request, res: Response) {
    const result = await this.adminService.updateUser(req.params.id, req.body);
    res.status(200).send(successResponse(result.data, 'User updated.'));
  }

  async updateUserStatus(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.adminService.updateUserStatus(req.user.id, req.params.id, req.body);
    res.status(200).send(successResponse(result.data, 'User status updated.'));
  }
}
