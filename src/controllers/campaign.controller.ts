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
 * POST /api/campaigns/create
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ApiError(400, 'Validation failed', errors);
    }

    const payload = parsed.data;
    const ownerId = (req as any).user.userId;

    const user = await User.findById(ownerId);
    if (!user) throw new ApiError(404, 'User not found');

    if (user.role !== 'projectOwner') {
      throw new ApiError(403, 'Only project owners can create campaigns.');
    }

    if (user.accountStatus !== 'active') {
      throw new ApiError(403, `Your account is ${user.accountStatus}. Complete onboarding to create campaigns.`);
    }

    const now = Date.now();
    const durationMs = payload.endDate.getTime() - now;
    let accumulatedPercentage = 0;

    const milestonesWithDates = payload.milestones.map((m) => {
      accumulatedPercentage += m.percentage;
      const completionTime = now + (durationMs * (accumulatedPercentage / 100));
      return {
        title: m.title,
        description: m.description,
        fundPercentage: m.percentage,
        expectedCompletionDate: new Date(completionTime),
        status: 'pending' as const,
      };
    });

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
      milestones: milestonesWithDates,
      status: 'pending_approval',
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
      next(new ApiError(400, 'Validation failed', error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)));
      return;
    }
    next(error);
  }
};

/**
 * POST /api/campaigns/media-upload
 */
export const uploadCampaignMediaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    if (!file) throw new ApiError(400, 'Please upload a file');

    const filePath = await uploadCampaignMedia(file, 'media');
    res.status(200).json(new ApiResponse(200, 'Campaign media uploaded successfully', { filePath }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/my-campaigns
 * Returns campaigns for the logged-in project owner, with contributions summary.
 */
export const getMyCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = (req as any).user.userId;

    const campaigns = await Campaign.find({ ownerId }).sort({ createdAt: -1 });

    const formattedCampaigns = await Promise.all(campaigns.map(async (c) => {
      const signedCover = await getSignedUrl('kyc-documents', c.coverImage);

      // Build contributions with signed profile image URLs
      const contributions = await Promise.all(c.contributions.map(async (contrib) => ({
        walletAddress: contrib.walletAddress,
        name: contrib.name,
        email: contrib.email,
        profileImage: contrib.profileImage
          ? await getSignedUrl('kyc-documents', contrib.profileImage)
          : null,
        amountEth: contrib.amountEth,
        txHash: contrib.txHash,
        timestamp: contrib.timestamp,
      })));

      return {
        id: c._id,
        _id: c._id,
        title: c.title,
        summary: c.summary,
        category: c.category,
        coverImage: signedCover,
        targetFunding: c.targetFunding,
        status: c.status,
        createdAt: c.createdAt,
        reviewNotes: c.reviewNotes,
        goalDescription: c.goalDescription,
        endDate: c.endDate,
        milestones: c.milestones,
        contributions,
        withdrawals: c.withdrawals || [],
        contributorCount: c.contributions.length,
      };
    }));

    res.status(200).json(new ApiResponse(200, 'Your campaigns fetched successfully', formattedCampaigns));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/owner/:ownerId
 */
export const getCampaignsByOwnerId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerId } = req.params;

    const campaigns = await Campaign.find({ ownerId }).sort({ createdAt: -1 });

    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage),
      };
    }));

    res.status(200).json(new ApiResponse(200, 'Campaigns fetched successfully', formattedCampaigns));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/pending
 */
export const getPendingCampaigns = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending_approval' })
      .populate('ownerId', 'name email walletAddress')
      .sort({ createdAt: -1 });

    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage),
      };
    }));

    res.status(200).json(new ApiResponse(200, 'Pending campaigns fetched successfully', formattedCampaigns));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/campaigns/:campaignId/review
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
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    if (campaign.status !== 'pending_approval') {
      throw new ApiError(400, `Campaign is already ${campaign.status}`);
    }

    campaign.status = status;
    campaign.approvedBy = (req as any).user.userId;
    campaign.reviewNotes = notes;
    campaign.reviewedAt = new Date();
    await campaign.save();

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
 * GET /api/campaigns/active
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

    const formattedCampaigns = await Promise.all(campaigns.map(async (c: any) => {
      const campaignObj = c.toObject();
      return {
        ...campaignObj,
        id: campaignObj._id.toString(),
        coverImage: await getSignedUrl('kyc-documents', campaignObj.coverImage),
      };
    }));

    res.status(200).json(new ApiResponse(200, 'Active campaigns fetched successfully', formattedCampaigns));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/:campaignId
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

    if (!campaign) throw new ApiError(404, 'Campaign not found');

    const campaignObj = campaign.toObject();

    const [coverImageUrl, ownerImageUrl] = await Promise.all([
      getSignedUrl('kyc-documents', campaignObj.coverImage),
      campaignObj.ownerId && (campaignObj.ownerId as any).profileImage
        ? getSignedUrl('kyc-documents', (campaignObj.ownerId as any).profileImage)
        : Promise.resolve(null),
    ]);

    let mediaUrls: string[] = [];
    if (campaignObj.media && Array.isArray(campaignObj.media)) {
      const results = await Promise.all(
        campaignObj.media.map((path: string) => getSignedUrl('kyc-documents', path))
      );
      mediaUrls = results.filter((url): url is string => url !== null);
    }

    // Build contributions with resolved profile image URLs
    const contributions = await Promise.all(
      (campaignObj.contributions || []).map(async (contrib: any) => ({
        walletAddress: contrib.walletAddress,
        name: contrib.name,
        email: contrib.email,
        profileImage: contrib.profileImage
          ? await getSignedUrl('kyc-documents', contrib.profileImage)
          : null,
        amountEth: contrib.amountEth,
        txHash: contrib.txHash,
        timestamp: contrib.timestamp,
      }))
    );

    const formattedCampaign = {
      ...campaignObj,
      id: campaignObj._id.toString(),
      coverImage: coverImageUrl,
      media: mediaUrls,
      contributions,
      withdrawals: campaignObj.withdrawals || [],
      owner: campaign.ownerId
        ? {
            name: (campaign.ownerId as any).name,
            email: (campaign.ownerId as any).email,
            profileImage: ownerImageUrl,
          }
        : null,
    };

    delete (formattedCampaign as any).ownerId;

    res.status(200).json(new ApiResponse(200, 'Campaign fetched successfully', formattedCampaign));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/campaigns/:campaignId/contribution
 * Records a contributor's on-chain contribution with their identity info.
 * Called from the frontend immediately after tx.wait() resolves.
 */
export const recordContribution = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const { walletAddress, amountEth, txHash } = req.body as {
      walletAddress: string;
      amountEth: string;
      txHash: string;
    };

    if (!walletAddress || !amountEth || !txHash) {
      throw new ApiError(400, 'walletAddress, amountEth, and txHash are required');
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId as string)) {
      throw new ApiError(400, 'Invalid campaign ID');
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    // Look up contributor by wallet address to get identity
    const userId = (req as any).user.userId;
    const contributor = await User.findById(userId);
    if (!contributor) throw new ApiError(404, 'Contributor not found');

    campaign.contributions.push({
      walletAddress: walletAddress.toLowerCase(),
      userId: contributor._id as mongoose.Types.ObjectId,
      name: contributor.name,
      email: contributor.email,
      profileImage: contributor.profileImage,
      amountEth,
      txHash,
      timestamp: new Date(),
    });

    await campaign.save();

    res.status(201).json(
      new ApiResponse(201, 'Contribution recorded successfully', {
        contribution: {
          name: contributor.name,
          amountEth,
          txHash,
          timestamp: new Date(),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/my-contributions
 * Returns all contributions made by the authenticated contributor across all campaigns.
 */
export const getMyContributions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // Find all campaigns where this user has contributed
    const campaigns = await Campaign.find({ 'contributions.userId': userId });

    let totalAmountEth = 0;
    const result: any[] = [];

    for (const campaign of campaigns) {
      const signedCover = await getSignedUrl('kyc-documents', campaign.coverImage);

      const userContributions = campaign.contributions.filter(
        (c) => c.userId?.toString() === userId.toString()
      );

      for (const contrib of userContributions) {
        const amount = parseFloat(contrib.amountEth) || 0;
        totalAmountEth += amount;

        result.push({
          campaignId: campaign._id.toString(),
          campaignTitle: campaign.title,
          campaignCoverImage: signedCover,
          campaignStatus: campaign.status,
          amountEth: contrib.amountEth,
          txHash: contrib.txHash,
          timestamp: contrib.timestamp,
        });
      }
    }

    // Sort by most recent first
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json(
      new ApiResponse(200, 'Contributions fetched successfully', {
        contributions: result,
        totalAmountEth: totalAmountEth.toFixed(6),
        totalCampaigns: campaigns.length,
      })
    );
  } catch (error) {
    next(error);
  }
};
/**
 * POST /api/campaigns/:campaignId/withdrawal
 * Records an on-chain withdrawal in MongoDB so dashboard can show history
 * without querying the blockchain each time.
 */
export const recordWithdrawal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const { amountEth, txHash, blockNumber } = req.body as {
      amountEth:   string;
      txHash:      string;
      blockNumber?: number;
    };

    if (!amountEth || !txHash) {
      throw new ApiError(400, 'amountEth and txHash are required');
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId as string)) {
      throw new ApiError(400, 'Invalid campaign ID');
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    // Prevent duplicate recording (same txHash)
    const alreadyRecorded = campaign.withdrawals.some(w => w.txHash === txHash);
    if (alreadyRecorded) {
      res.status(200).json(new ApiResponse(200, 'Withdrawal already recorded', {}));
      return;
    }

    campaign.withdrawals.push({
      amountEth,
      txHash,
      blockNumber,
      timestamp: new Date(),
    });

    await campaign.save();

    res.status(201).json(
      new ApiResponse(201, 'Withdrawal recorded successfully', {
        withdrawal: { amountEth, txHash, timestamp: new Date() },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/saved-campaigns
 * Get the currently authenticated user's saved campaign IDs.
 */
export const getSavedCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    res.status(200).json(
      new ApiResponse(200, 'Saved campaigns retrieved', user.savedCampaigns || [])
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/campaigns/:campaignId/save
 * Toggle save status of a campaign for the authenticated user.
 */
export const toggleSavedCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) throw new ApiError(401, 'Unauthorized');
    if (!mongoose.Types.ObjectId.isValid(campaignId as string)) {
      throw new ApiError(400, 'Invalid campaign ID');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const objId = new mongoose.Types.ObjectId(campaignId as string);
    const existingIndex = user.savedCampaigns.findIndex(id => id.equals(objId));

    if (existingIndex > -1) {
      // Remove it
      user.savedCampaigns.splice(existingIndex, 1);
    } else {
      // Add it
      user.savedCampaigns.push(objId);
    }

    await user.save();

    res.status(200).json(
      new ApiResponse(200, 'Saved campaigns updated', user.savedCampaigns)
    );
  } catch (error) {
    next(error);
  }
};
