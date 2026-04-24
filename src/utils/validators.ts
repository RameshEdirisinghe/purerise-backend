import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z
    .enum(['admin', 'projectOwner', 'contributor'])
    .optional()
    .default('contributor'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phoneNumber: z.string().min(5, 'Valid phone number is required'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date of birth'),
  country: z.string().min(2, 'Country is required'),
  idType: z.enum(['passport', 'nic', 'driver_license']),
  // In a real app, these would be file paths from a file upload middleware
  idFrontImage: z.string().min(1, 'ID Front image is required'),
  idBackImage: z.string().min(1, 'ID Back image is required'),
  selfieImage: z.string().min(1, 'selfie image is required'),
  purposeCategory: z.enum(['startup', 'medical', 'education', 'social', 'technology', 'personal']),
  profileHeadline: z.string().min(5, 'Profile headline is required'),
  profileBio: z.string().min(1, 'Profile Bio is required'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Creation Validation
// ─────────────────────────────────────────────────────────────────────────────

export const milestoneSchema = z.object({
  title: z
    .string({ required_error: 'Milestone title is required' })
    .min(3, 'Milestone title must be at least 3 characters')
    .max(100, 'Milestone title must be at most 100 characters')
    .trim(),
  description: z
    .string({ required_error: 'Milestone description is required' })
    .min(10, 'Milestone description must be at least 10 characters')
    .max(1000, 'Milestone description must be at most 1000 characters')
    .trim(),
  percentage: z
    .number({ required_error: 'Release percentage is required' })
    .min(1, 'Release percentage must be at least 1%')
    .max(100, 'Release percentage must be at most 100%')
    .int('Release percentage must be a whole number'),
});

export const createCampaignSchema = z.object({
  title: z
    .string({ required_error: 'Campaign title is required' })
    .trim(),
  summary: z
    .string({ required_error: 'Campaign summary is required' })
    .trim(),
  description: z
    .string({ required_error: 'Campaign description is required' })
    .trim(),
  category: z
    .enum(['startup', 'medical', 'education', 'social', 'technology', 'personal'], {
      required_error: 'Category is required',
      invalid_type_error: 'Invalid category selected',
    }),
  coverImage: z
    .string({ required_error: 'Cover image is required' })
    .min(1, 'Cover image path is required'),
  goalDescription: z
    .string({ required_error: 'Goal description is required' })
    .trim(),
  targetFunding: z
    .number({ required_error: 'Funding goal is required' })
    .positive('Funding goal must be greater than 0'),
  endDate: z.coerce.date({
    required_error: 'End date is required',
    invalid_type_error: 'Invalid end date format',
  }),
  milestones: z
    .array(milestoneSchema, { required_error: 'At least one milestone is required' })
    .min(1, 'At least one milestone is required')
    .refine(
      (ms) => ms.reduce((sum, m) => sum + m.percentage, 0) === 100,
      'Milestone percentages must total exactly 100%'
    ),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
