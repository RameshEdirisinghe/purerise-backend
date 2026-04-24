import { Request, Response, NextFunction } from 'express';
import Campaign from '../models/Campaign';
import { ApiResponse, ApiError } from '../utils/apiResponse';
import { uploadCampaignMedia } from '../utils/uploadImage';

/**
 * Upload campaign media to Supabase Storage
 */
export const uploadCampaignMediaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError(400, 'Please upload a file');
    }

    // Use the dedicated campaign media utility
    const filePath = await uploadCampaignMedia(file, 'media');

    res.status(200).json(
      new ApiResponse(200, 'Campaign media uploaded successfully', { filePath })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all campaigns for the logged-in campaign owner
 */
export const getMyCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = (req as any).user.userId;
    
    const campaigns = await Campaign.find({ ownerId })
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, 'Your campaigns fetched successfully', campaigns)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaigns by a specific owner ID (Admin/Public use)
 */
export const getCampaignsByOwnerId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerId } = req.params;
    
    const campaigns = await Campaign.find({ ownerId })
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, 'Campaigns fetched successfully', campaigns)
    );
  } catch (error) {
    next(error);
  }
};
