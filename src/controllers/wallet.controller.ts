import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { ApiResponse, ApiError } from '../utils/apiResponse';

// ── Ethereum address validator ────────────────────────────────────────────────
const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/wallet
// Body: { walletAddress: string }
// Protected — requires valid access token cookie
// ─────────────────────────────────────────────────────────────────────────────
export const saveWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { walletAddress } = req.body as { walletAddress?: string };

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ApiError(400, 'walletAddress is required');
    }

    const normalised = walletAddress.trim().toLowerCase();

    if (!ETH_ADDRESS_REGEX.test(walletAddress.trim())) {
      throw new ApiError(400, 'Invalid Ethereum address format');
    }

    // ── Conflict check — another user already owns this address ───────────────
    const conflict = await User.findOne({
      walletAddress: normalised,
      _id: { $ne: req.user?.userId },
    });

    if (conflict) {
      throw new ApiError(
        409,
        'This wallet address is already linked to another account'
      );
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const user = await User.findById(req.user?.userId);
    if (!user) throw new ApiError(404, 'User not found');

    user.walletAddress = normalised;
    user.isWalletConnected = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
      new ApiResponse(200, 'Wallet address saved successfully', {
        walletAddress: user.walletAddress,
        isWalletConnected: user.isWalletConnected,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/auth/wallet
// Protected — requires valid access token cookie
// ─────────────────────────────────────────────────────────────────────────────
export const removeWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new ApiError(404, 'User not found');

    user.walletAddress = undefined;
    user.isWalletConnected = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
      new ApiResponse(200, 'Wallet disconnected successfully')
    );
  } catch (error) {
    next(error);
  }
};
