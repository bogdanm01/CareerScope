import { apiGet } from './panel-api';

export type SkillCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type Skill = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export const getSkillCategories = async () => apiGet<SkillCategory[]>('/api/skill-categories');

export const getSkills = async (query?: Record<string, string | number | boolean | null | undefined>) =>
  apiGet<Skill[]>('/api/skills', { query });
