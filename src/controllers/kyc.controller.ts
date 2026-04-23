import { Request, Response, NextFunction } from 'express';
import { uploadImage } from '../utils/uploadImage';
import { ApiResponse, ApiError } from '../utils/apiResponse';

/**
 * @desc    Upload KYC document to Supabase Storage
 * @route   POST /api/kyc/kyc-upload
 * @access  Private (Contributor/Admin)
 */
export const uploadKYCDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;

    if (!file) {
      throw new ApiError(400, 'Please upload a file');
    }

    // Folder 'ids' as per user example
    const filePath = await uploadImage(file, 'ids');

    return res
      .status(200)
      .json(new ApiResponse(200, 'KYC document uploaded successfully', { filePath }));
  } catch (error) {
    next(error);
  }
};
