import { Request, Response, NextFunction } from 'express';
import CampaignOwnerRequest from '../models/CampaignOwnerRequest';
import User from '../models/user.model';
import { onboardingSchema } from '../utils/validators';
import { ApiResponse, ApiError } from '../utils/apiResponse';

/**
 * Submit onboarding details for a Campaign Owner
 * POST /api/onboarding/campaign-owner
 */
export const submitCampaignOwnerOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    // Check if user is already a projectOwner and hasn't already submitted
    const user = await User.findById(userId);
    if (!user || user.role !== 'projectOwner') {
      throw new ApiError(403, 'Only users with the Campaign Owner role can submit onboarding');
    }

    const existingRequest = await CampaignOwnerRequest.findOne({ userId });
    if (existingRequest) {
      throw new ApiError(400, 'You have already submitted an onboarding request');
    }

    // Validate data
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message);
      throw new ApiError(400, 'Validation failed', errors);
    }

    // Create the request
    const onboardingRequest = await CampaignOwnerRequest.create({
      userId,
      ...parsed.data,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
    });

    // Update user status if necessary (e.g., mark as pending approval)
    user.accountStatus = 'pending';
    await user.save();

    res.status(201).json(
      new ApiResponse(201, 'Onboarding application submitted successfully', onboardingRequest)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's onboarding status
 * GET /api/onboarding/status
 */
export const getOnboardingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const onboardingRequest = await CampaignOwnerRequest.findOne({ userId });

    if (!onboardingRequest) {
      res.status(200).json(new ApiResponse(200, 'No onboarding request found', { hasSubmitted: false }));
      return;
    }

    res.status(200).json(
      new ApiResponse(200, 'Onboarding status fetched', {
        hasSubmitted: true,
        status: onboardingRequest.status,
        submittedAt: onboardingRequest.submittedAt,
        reviewedAt: onboardingRequest.reviewedAt,
        notes: onboardingRequest.reviewNotes,
      })
    );
  } catch (error) {
    next(error);
  }
};
