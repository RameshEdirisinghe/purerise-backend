import { Request, Response, NextFunction } from 'express';
import CampaignOwnerRequest from '../models/CampaignOwnerRequest';
import User from '../models/user.model';
import { ApiResponse, ApiError } from '../utils/apiResponse';
import { supabase } from '../config/supabase';
import { sendMail } from '../services/email.service';
import { getOnboardingApprovalTemplate, getOnboardingRejectionTemplate } from '../utils/emailTemplates';

/**
 * Fetch all pending campaign owner requests
 */
export const getPendingRequests = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await CampaignOwnerRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .sort({ submittedAt: -1 });

    res.status(200).json(
      new ApiResponse(200, 'Pending requests fetched successfully', requests)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Review (Approve/Reject) a campaign owner request
 */
export const reviewRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be approved or rejected.');
    }

    const request = await CampaignOwnerRequest.findById(requestId);
    if (!request) {
      throw new ApiError(404, 'Request not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, `Request has already been ${request.status}`);
    }

    // Update request
    request.status = status;
    request.reviewNotes = notes;
    request.reviewedBy = (req as any).user.userId;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, update user status and role
    if (status === 'approved') {
      const user = await User.findById(request.userId);
      if (user) {
        user.accountStatus = 'active';
        await user.save({ validateBeforeSave: false });

        // Send Approval Email
        await sendMail({
          to: user.email,
          subject: 'PureRaise: Your Campaign Owner Account is Active! 🚀',
          html: getOnboardingApprovalTemplate(user.name, `${process.env.CLIENT_URL}/login`)
        }).catch(err => console.error('Email sending failed:', err));
      }
    } else {
      // If rejected, we might want to keep user as pending but they'll need to re-submit
      const user = await User.findById(request.userId);
      if (user) {
        user.accountStatus = 'rejected';
        await user.save({ validateBeforeSave: false });

        // Send Rejection Email
        await sendMail({
          to: user.email,
          subject: 'Update on your PureRaise Campaign Owner Application',
          html: getOnboardingRejectionTemplate(user.name, notes, `${process.env.CLIENT_URL}/onboarding/campaign-owner`)
        }).catch(err => console.error('Email sending failed:', err));
      }
    }

    res.status(200).json(
      new ApiResponse(200, `Request successfully ${status}`, request)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a signed URL for a KYC document
 */
export const getSignedFileUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      throw new ApiError(400, 'File path is required');
    }

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) {
      throw new ApiError(404, `Could not generate URL: ${error.message}`);
    }

    res.status(200).json(
      new ApiResponse(200, 'Signed URL generated', { signedUrl: data.signedUrl })
    );
  } catch (error) {
    next(error);
  }
};
