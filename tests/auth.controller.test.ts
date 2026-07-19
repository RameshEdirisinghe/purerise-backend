import { Request, Response, NextFunction } from 'express';
import { register, login } from '../src/controllers/auth.controller';
import User from '../src/models/user.model';
import * as tokenUtils from '../src/utils/generateTokens';
import { ApiError } from '../src/utils/apiResponse';


jest.mock('../src/models/user.model');
jest.mock('../src/utils/generateTokens');

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register (Critical)', () => {
    it('should create a user and return 201 on valid input', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'contributor',
      };

      const mockUser = {
        _id: 'userId123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'contributor',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(tokenUtils, 'setTokenCookies').mockReturnValue({ accessToken: 'mockAccessToken', refreshToken: 'mockToken' });

      // Act
      await register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalled();
      expect(tokenUtils.setTokenCookies).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Account created successfully',
        })
      );
    });

    it('should fail if email is already in use (Critical)', async () => {
      // Arrange
      mockReq.body = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'contributor',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existingId' });

      // Act
      await register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const errorArg = mockNext.mock.calls[0][0];
      expect(errorArg.statusCode).toBe(409);
      expect(errorArg.message).toBe('An account with this email already exists');
    });

    it('should set accountStatus to pending for projectOwner', async () => {
      // Arrange
      mockReq.body = {
        name: 'Project Owner',
        email: 'owner@example.com',
        password: 'Password123!',
        role: 'projectOwner',
      };

      const mockUser = {
        _id: 'ownerId123',
        name: 'Project Owner',
        email: 'owner@example.com',
        role: 'projectOwner',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(tokenUtils, 'setTokenCookies').mockReturnValue({ accessToken: 'mockAccessToken', refreshToken: 'mockToken' });

      // Act
      await register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        accountStatus: 'pending'
      }));
    });
  });

  describe('POST /api/auth/login (Critical)', () => {
    it('should return a token for valid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        _id: 'userId123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'contributor',
        accountStatus: 'active',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock chainable mongoose queries
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockQuery);
      jest.spyOn(tokenUtils, 'setTokenCookies').mockReturnValue({ accessToken: 'mockAccessToken', refreshToken: 'mockToken' });

      // Act
      await login(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(tokenUtils.setTokenCookies).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged in successfully',
        })
      );
    });

    it('should fail with invalid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'WrongPassword!',
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(null), // User not found
      };
      (User.findOne as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await login(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });
  });
});
