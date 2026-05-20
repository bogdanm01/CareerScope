import express from 'express';
import { container } from 'tsyringe';
import { TOKENS } from '../config/dependency-tokens.ts';
import { SkillController } from '../controllers/skill.controller.ts';

export const getSkillRouter = () => {
  const router = express.Router();
  const skillController = container.resolve<SkillController>(TOKENS.skillController);

  router.get('/skill-categories', skillController.getSkillCategories.bind(skillController));

  router.get('/skills', skillController.getSkills.bind(skillController));

  return router;
};
