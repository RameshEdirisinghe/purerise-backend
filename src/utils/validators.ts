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
