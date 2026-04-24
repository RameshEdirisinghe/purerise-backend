import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { setTokenCookies, clearTokenCookies } from '../utils/generateTokens';
import { verifyRefreshToken } from '../services/token.service';
import { ApiResponse, ApiError } from '../utils/apiResponse';
import { registerSchema, loginSchema } from '../utils/validators';
import { uploadImage, getSignedUrl } from '../utils/uploadImage';
import { ZodError } from 'zod';

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      throw new ApiError(400, 'Validation failed', errors);
    }

    const { name, email, password, role } = parsed.data;

    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Create user (password is hashed in pre-save hook)
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role,
      accountStatus: role === 'projectOwner' ? 'pending' : 'active'
    });

    // Issue tokens
    const payload = { userId: user._id.toString(), role: user.role };
    const { refreshToken } = setTokenCookies(res, payload);

    // Store refresh token hash server-side for rotation validation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json(
      new ApiResponse(201, 'Account created successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    if (error instanceof ZodError) {
      next(new ApiError(400, 'Validation failed', error.errors.map((e) => e.message)));
      return;
    }
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/register-admin
// ─────────────────────────────────────────────
export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, adminKey } = req.body;

    // Simple secret check for creating admin via API
    if (adminKey !== 'PR_ADMIN_2024_SECRET') {
      throw new ApiError(403, 'Unauthorized. Invalid admin creation key.');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'admin',
      accountStatus: 'active' 
    });

    res.status(201).json(
      new ApiResponse(201, 'Admin account created successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      throw new ApiError(400, 'Validation failed', errors);
    }

    const { email, password } = parsed.data;

    // Fetch user with password field (excluded by default)
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Issue tokens
    const payload = { userId: user._id.toString(), role: user.role };
    const { refreshToken } = setTokenCookies(res, payload);

    // Persist new refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Profile Image
    const profileImageUrl = user.profileImage 
      ? await getSignedUrl('kyc-documents', user.profileImage)
      : null;

    res.status(200).json(
      new ApiResponse(200, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: profileImageUrl
        },
        redirectTo: user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'contributor' 
            ? '/contributor/dashboard' 
            : user.role === 'projectOwner' 
              ? (user.accountStatus === 'active' ? '/campaign-owner/dashboard' : '/onboarding/campaign-owner')
              : '/',
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token: string | undefined = req.cookies['refreshToken'];
    if (!token) {
      throw new ApiError(401, 'Refresh token missing');
    }

    // Verify token signature
    const decoded = verifyRefreshToken(token);

    // Validate against stored token (rotation check)
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, 'Invalid refresh token — please log in again');
    }

    // Issue new access token only
    const payload = { userId: user._id.toString(), role: user.role };
    const { refreshToken: newRefreshToken } = setTokenCookies(res, payload);

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // Profile Image
    const profileImageUrl = user.profileImage 
      ? await getSignedUrl('kyc-documents', user.profileImage)
      : null;

    res.status(200).json(new ApiResponse(200, 'Token refreshed', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: profileImageUrl
      },
    }));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token: string | undefined = req.cookies['refreshToken'];

    if (token) {
      const user = await User.findOne({ refreshToken: token }).select('+refreshToken');
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }

    clearTokenCookies(res);
    res.status(200).json(new ApiResponse(200, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me  (used by frontend on mount)
// ─────────────────────────────────────────────
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const profileImageUrl = user.profileImage 
      ? await getSignedUrl('kyc-documents', user.profileImage)
      : null;

    res.status(200).json(
      new ApiResponse(200, 'User fetched', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: profileImageUrl,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/auth/profile
// ─────────────────────────────────────────────
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, profileImage } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;

    await user.save({ validateBeforeSave: false });

    const profileImageUrl = user.profileImage 
      ? await getSignedUrl('kyc-documents', user.profileImage)
      : null;

    res.status(200).json(
      new ApiResponse(200, 'Profile updated successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: profileImageUrl
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/profile-image
// ─────────────────────────────────────────────
export const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError(400, 'Please upload a file');
    }

    // Upload to 'kyc-documents' bucket as requested
    const filePath = await uploadImage(file, 'profiles');

    res.status(200).json(
      new ApiResponse(200, 'Profile image uploaded successfully', { filePath })
    );
  } catch (error) {
    next(error);
  }
};
