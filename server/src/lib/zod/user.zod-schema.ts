import z from 'zod';

export const AddCandidateSkillsRequestSchema = z
  .object({
    skills: z
      .array(
        z.object({
          id: z
            .number({ error: 'Skill id is required.' })
            .int('Skill id must be an integer.')
            .positive('Skill id must be a positive integer.'),
          yearsOfExperience: z
            .number({ error: 'Years of experience is required.' })
            .int('Years of experience must be an integer.')
            .min(0, 'Years of experience cannot be negative.')
            .max(60, 'Years of experience cannot be greater than 60.'),
        }),
      )
      .min(1, 'At least one skill is required.')
      .max(50, 'You can add up to 50 skills.'),
  })
  .superRefine((data, ctx) => {
    const seenSkillIds = new Set<number>();

    data.skills.forEach((skill, index) => {
      if (seenSkillIds.has(skill.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills', index, 'id'],
          message: 'Duplicate skill id is not allowed.',
        });
      }

      seenSkillIds.add(skill.id);
    });
  });
