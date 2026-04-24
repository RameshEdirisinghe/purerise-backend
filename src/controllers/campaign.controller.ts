import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign';
import User from '../models/user.model';
import { ApiResponse, ApiError } from '../utils/apiResponse';
import { createCampaignSchema } from '../utils/validators';
import { uploadCampaignMedia, getSignedUrl } from '../utils/uploadImage';
import { ZodError } from 'zod';
import { sendMail } from '../services/email.service';
import { getCampaignApprovalTemplate, getCampaignRejectionTemplate } from '../utils/emailTemplates';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/campaigns/create
 * ─────────────────────────────────────────────────────────────────────────────
 * Create a new campaign and deploy to pending_approval status
 * 
 * Expected payload:
 * {
 *   title: string
 *   summary: string
 *   description: string
 *   category: 'startup' | 'medical' | 'education' | 'social' | 'technology' | 'personal'
 *   coverImage: string (path from Supabase)
 *   goalDescription: string
 *   milestones: Array<{ title, description, percentage }>
 * }
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ApiError(400, 'Validation failed', errors);
    }

    const payload = parsed.data;
    const ownerId = (req as any).user.userId;

    // Fetch user to verify they are a projectOwner
    const user = await User.findById(ownerId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.role !== 'projectOwner') {
      throw new ApiError(
        403,
        'Only project owners can create campaigns. Please upgrade your account to create campaigns.'
      );
    }

    // Check if user has completed onboarding (for projectOwner)
    if (user.accountStatus !== 'active') {
      throw new ApiError(
        403,
        `Your account is ${user.accountStatus}. Complete onboarding to create campaigns.`
      );
    }

    // Create campaign document
    const campaign = await Campaign.create({
      ownerId: user._id,
      title: payload.title,
      summary: payload.summary,
      description: payload.description,
      category: payload.category,
      coverImage: payload.coverImage,
      goalDescription: payload.goalDescription,
      targetFunding: payload.targetFunding,
      endDate: payload.endDate,
      milestones: payload.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        expectedCompletionDate: payload.endDate, // Use campaign end date for all milestones by default
        status: 'pending',
      })),
      status: 'pending_approval', // Requires admin review before going live
    });

    res.status(201).json(
      new ApiResponse(201, 'Campaign created successfully. Awaiting admin approval.', {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          status: campaign.status,
          category: campaign.category,
          createdAt: campaign.createdAt,
        },
      })
    );
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new ApiError(
          400,
          'Validation failed',
          error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        )
      );
      return;
    }
    next(error);
  }
};

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
    
    // Generate signed URLs for each campaign cover image
    const formattedCampaigns = await Promise.all(campaigns.map(async (c) => ({
      id: c._id,
      title: c.title,
      summary: c.summary,
      category: c.category,
      coverImage: await getSignedUrl('kyc-documents', c.coverImage),
      targetFunding: c.targetFunding,
      status: c.status,
      createdAt: c.createdAt,
      reviewNotes: c.reviewNotes,
      goalDescription: c.goalDescription,
      endDate: c.endDate,
      milestones: c.milestones
    })));

    res.status(200).json(
      new ApiResponse(200, 'Your campaigns fetched successfully', formattedCampaigns)
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

    // Generate signed URLs for each campaign cover image
    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage)
      };
    }));

    res.status(200).json(
      new ApiResponse(200, 'Campaigns fetched successfully', formattedCampaigns)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all campaigns with 'pending_approval' status (Admin only)
 */
export const getPendingCampaigns = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending_approval' })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    // Generate signed URLs for each campaign cover image
    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage)
      };
    }));

    res.status(200).json(
      new ApiResponse(200, 'Pending campaigns fetched successfully', formattedCampaigns)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Review (Approve/Reject) a campaign (Admin only)
 */
export const reviewCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campaignId } = req.params;
    const { status, notes } = req.body;

    if (!['active', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be active or rejected.');
    }

    const campaign = await Campaign.findById(campaignId).populate('ownerId', 'name email');
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.status !== 'pending_approval') {
      throw new ApiError(400, `Campaign is already ${campaign.status}`);
    }

    // Update campaign status
    campaign.status = status;
    campaign.approvedBy = (req as any).user.userId;
    campaign.reviewNotes = notes;
    campaign.reviewedAt = new Date();
    await campaign.save();

    // Send Email Notification
    const owner = campaign.ownerId as any;
    if (owner && owner.email) {
      if (status === 'active') {
        await sendMail({
          to: owner.email,
          subject: `PureRaise: Your Campaign "${campaign.title}" is LIVE! 🚀`,
          html: getCampaignApprovalTemplate(owner.name, campaign.title, `${process.env.CLIENT_URL}/campaign-owner/dashboard`)
        }).catch(err => console.error('Approval email failed:', err));
      } else {
        await sendMail({
          to: owner.email,
          subject: `Update on your campaign: "${campaign.title}"`,
          html: getCampaignRejectionTemplate(owner.name, campaign.title, notes, `${process.env.CLIENT_URL}/campaign-owner/create`)
        }).catch(err => console.error('Rejection email failed:', err));
      }
    }

    res.status(200).json(
      new ApiResponse(200, `Campaign successfully ${status === 'active' ? 'approved' : 'rejected'}`, campaign)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active campaigns for discovery (Public/Contributor)
 */
export const getActiveCampaigns = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' })
      .populate('ownerId', 'name')
      .sort({ createdAt: -1 });

    // Generate signed URLs for each campaign cover image
    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage)
      };
    }));

    res.status(200).json(
      new ApiResponse(200, 'Active campaigns fetched successfully', formattedCampaigns)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single campaign by ID with signed URL for cover image
 */
export const getCampaignById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campaignId } = req.params;

    if (!campaignId || campaignId === 'undefined') {
      throw new ApiError(400, 'Invalid campaign ID provided');
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId as string)) {
      throw new ApiError(400, 'Invalid campaign ID format');
    }

    const campaign = await Campaign.findById(campaignId).populate('ownerId', 'name email profileImage');
    
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    const campaignObj = campaign.toObject();
    
    // Generate signed URLs
    const [coverImageUrl, ownerImageUrl] = await Promise.all([
      getSignedUrl('kyc-documents', campaignObj.coverImage),
      campaignObj.ownerId && (campaignObj.ownerId as any).profileImage 
        ? getSignedUrl('kyc-documents', (campaignObj.ownerId as any).profileImage) // Assuming profile images might be in kyc or a separate bucket
        : Promise.resolve(null)
    ]);

    const formattedCampaign = {
      ...campaignObj,
      id: campaignObj._id.toString(),
      coverImage: coverImageUrl,
      owner: campaign.ownerId ? {
        name: (campaign.ownerId as any).name,
        email: (campaign.ownerId as any).email,
        profileImage: ownerImageUrl
      } : null
    };

    // Remove the internal ownerId to avoid confusion on frontend
    delete (formattedCampaign as any).ownerId;

    res.status(200).json(
      new ApiResponse(200, 'Campaign fetched successfully', formattedCampaign)
    );
  } catch (error) {
    next(error);
  }
};
