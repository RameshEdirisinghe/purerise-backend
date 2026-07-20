import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createCampaign,
  reviewCampaign,
  getCampaignById,
  getMyCampaigns,
} from '../src/controllers/campaign.controller';
import Campaign from '../src/models/Campaign';
import User from '../src/models/user.model';
import { ApiError } from '../src/utils/apiResponse';
import * as uploadUtils from '../src/utils/uploadImage';
import * as emailService from '../src/services/email.service';

jest.mock('../src/models/Campaign');
jest.mock('../src/models/user.model');
jest.mock('../src/utils/uploadImage');
jest.mock('../src/services/email.service');

const validCampaignBody = {
  title: 'Clean Water Initiative',
  summary: 'Bringing clean water to rural communities.',
  description: 'A detailed description of the clean water initiative that helps communities.',
  category: 'social',
  coverImage: 'covers/clean-water.jpg',
  goalDescription: 'Fund water purification systems for 5 villages.',
  targetFunding: 50,
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  milestones: [
    { title: 'Phase 1 – Research', description: 'Conduct site surveys and needs assessment.', percentage: 40 },
    { title: 'Phase 2 – Build', description: 'Install purification units in target villages.', percentage: 60 },
  ],
};

const mockProjectOwner = {
  _id: new mongoose.Types.ObjectId('64a000000000000000000001'),
  name: 'Alice Owner',
  email: 'alice@example.com',
  role: 'projectOwner',
  accountStatus: 'active',
};

describe('Campaign Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, cookies: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('POST /api/campaigns/create (Critical)', () => {
    it('should create a campaign and return 201 for an active projectOwner', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };
      mockReq.body = { ...validCampaignBody };

      (User.findById as jest.Mock).mockResolvedValue(mockProjectOwner);

      const mockCreatedCampaign = {
        _id: new mongoose.Types.ObjectId(),
        title: validCampaignBody.title,
        status: 'pending_approval',
        category: validCampaignBody.category,
        createdAt: new Date(),
      };
      (Campaign.create as jest.Mock).mockResolvedValue(mockCreatedCampaign);

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith(mockProjectOwner._id.toString());
      expect(Campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validCampaignBody.title,
          status: 'pending_approval',
          ownerId: mockProjectOwner._id,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Campaign created successfully. Awaiting admin approval.',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject creation if the user is not a projectOwner (Critical)', async () => {
      (mockReq as any).user = { userId: 'contributorId' };
      mockReq.body = { ...validCampaignBody };

      (User.findById as jest.Mock).mockResolvedValue({
        ...mockProjectOwner,
        role: 'contributor',
      });

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/Only project owners can create campaigns/i);
    });

    it('should reject creation if the account is not active (Critical)', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };
      mockReq.body = { ...validCampaignBody };

      (User.findById as jest.Mock).mockResolvedValue({
        ...mockProjectOwner,
        accountStatus: 'pending',
      });

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(403);
    });

    it('should return 404 if the user is not found', async () => {
      (mockReq as any).user = { userId: 'nonexistentId' };
      mockReq.body = { ...validCampaignBody };

      (User.findById as jest.Mock).mockResolvedValue(null);

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('User not found');
    });

    it('should fail validation if milestones do not total 100% (High)', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };
      mockReq.body = {
        ...validCampaignBody,
        milestones: [
          { title: 'Phase 1', description: 'First phase of the project.', percentage: 40 },
          { title: 'Phase 2', description: 'Second phase of the project.', percentage: 40 },
        ],
      };

      (User.findById as jest.Mock).mockResolvedValue(mockProjectOwner);

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
    });

    it('should fail validation if required fields are missing (High)', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };
      mockReq.body = { title: 'Only title, nothing else' };

      (User.findById as jest.Mock).mockResolvedValue(mockProjectOwner);

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Validation failed');
    });

    it('should include proposalPdf in Campaign.create payload when provided', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };
      mockReq.body = { ...validCampaignBody, proposalPdf: 'proposals/doc.pdf' };

      (User.findById as jest.Mock).mockResolvedValue(mockProjectOwner);
      (Campaign.create as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        title: validCampaignBody.title,
        status: 'pending_approval',
        category: validCampaignBody.category,
        createdAt: new Date(),
      });

      await createCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(Campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({ proposalPdf: 'proposals/doc.pdf' })
      );
    });
  });

  describe('PATCH /api/campaigns/:campaignId/review (Critical)', () => {
    const campaignId = new mongoose.Types.ObjectId().toString();

    const buildMockCampaign = (overrides: any = {}) => ({
      _id: campaignId,
      title: 'Clean Water Initiative',
      status: 'pending_approval',
      ownerId: { name: 'Alice', email: 'alice@example.com' },
      save: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    beforeEach(() => {
      mockReq.params = { campaignId };
      (mockReq as any).user = { userId: 'adminId123', role: 'admin' };
      (emailService.sendCampaignApprovedEmail as jest.Mock).mockResolvedValue(undefined);
      (emailService.sendCampaignRejectedEmail as jest.Mock).mockResolvedValue(undefined);
    });

    it('should approve a pending campaign and return 200 (Critical)', async () => {
      mockReq.body = { status: 'active', notes: 'Looks great!' };

      const mockCampaign = buildMockCampaign();
      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCampaign),
      });

      await reviewCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCampaign.status).toBe('active');
      expect(mockCampaign.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject a pending campaign and return 200 (Critical)', async () => {
      mockReq.body = { status: 'rejected', notes: 'Needs more detail.' };

      const mockCampaign = buildMockCampaign();
      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCampaign),
      });

      await reviewCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockCampaign.status).toBe('rejected');
      expect(mockCampaign.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for an invalid status value', async () => {
      mockReq.body = { status: 'banana', notes: '' };

      await reviewCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/Invalid status/i);
    });

    it('should return 404 if campaign does not exist', async () => {
      mockReq.body = { status: 'active', notes: '' };

      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await reviewCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(404);
    });

    it('should return 400 if campaign is not in pending_approval state (High)', async () => {
      mockReq.body = { status: 'active', notes: '' };

      const mockCampaign = buildMockCampaign({ status: 'active' });
      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCampaign),
      });

      await reviewCampaign(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/already/i);
    });
  });

  describe('GET /api/campaigns/:campaignId (High)', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      (uploadUtils.getSignedUrl as jest.Mock).mockResolvedValue('https://cdn.example.com/image.jpg');
    });

    it('should return 200 with a formatted campaign for a valid ID', async () => {
      mockReq.params = { campaignId: validId };

      const campaignDoc = {
        _id: new mongoose.Types.ObjectId(validId),
        title: 'Clean Water Initiative',
        coverImage: 'covers/img.jpg',
        ownerId: { name: 'Alice', email: 'alice@example.com', profileImage: null },
        media: [],
        contributions: [],
        withdrawals: [],
        proposalPdf: null,
        toObject: jest.fn().mockReturnValue({
          _id: new mongoose.Types.ObjectId(validId),
          title: 'Clean Water Initiative',
          coverImage: 'covers/img.jpg',
          ownerId: { name: 'Alice', email: 'alice@example.com', profileImage: null },
          media: [],
          contributions: [],
          withdrawals: [],
          proposalPdf: null,
        }),
      };

      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(campaignDoc),
      });

      await getCampaignById(mockReq as Request, mockRes as Response, mockNext);

      expect(Campaign.findById).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Campaign fetched successfully' })
      );
    });

    it('should return 400 for an invalid ObjectId format', async () => {
      mockReq.params = { campaignId: 'not-a-valid-id' };

      await getCampaignById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/Invalid campaign ID/i);
    });

    it('should return 400 if campaignId is literally "undefined"', async () => {
      mockReq.params = { campaignId: 'undefined' };

      await getCampaignById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
    });

    it('should return 404 if campaign does not exist', async () => {
      mockReq.params = { campaignId: validId };

      (Campaign.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getCampaignById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const err = mockNext.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Campaign not found');
    });
  });

  describe('GET /api/campaigns/my-campaigns (High)', () => {
    it('should return formatted campaigns for the authenticated owner', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };

      const mockCampaigns = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Campaign A',
          summary: 'Summary A',
          category: 'startup',
          coverImage: 'covers/a.jpg',
          targetFunding: 10,
          status: 'active',
          createdAt: new Date(),
          reviewNotes: null,
          goalDescription: 'Goal A',
          endDate: new Date(),
          milestones: [],
          contributions: [],
          withdrawals: [],
        },
      ];

      (Campaign.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCampaigns),
      });
      (uploadUtils.getSignedUrl as jest.Mock).mockResolvedValue('https://cdn.example.com/img.jpg');

      await getMyCampaigns(mockReq as Request, mockRes as Response, mockNext);

      expect(Campaign.find).toHaveBeenCalledWith({ ownerId: mockProjectOwner._id.toString() });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Your campaigns fetched successfully',
        })
      );
    });

    it('should return an empty array if the owner has no campaigns', async () => {
      (mockReq as any).user = { userId: mockProjectOwner._id.toString() };

      (Campaign.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await getMyCampaigns(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.data).toEqual([]);
    });
  });
});
