import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../src/middleware/auth.middleware';
import * as tokenService from '../src/services/token.service';
import { ApiError } from '../src/utils/apiResponse';

jest.mock('../src/services/token.service');

describe('Auth Middleware (High)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      cookies: {},
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next if valid access token is present', () => {
    // Arrange
    mockReq.cookies = { accessToken: 'validToken' };
    (tokenService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'user123',
      role: 'contributor',
    });

    // Act
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('validToken');
    expect(mockReq.user).toEqual({ userId: 'user123', role: 'contributor' });
    expect(mockNext).toHaveBeenCalledWith(); // Called without arguments (success)
  });

  it('should fail if access token is missing', () => {
    // Act
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const errorArg = mockNext.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toBe('Access token missing. Please log in.');
  });

  it('should fail if access token is invalid', () => {
    // Arrange
    mockReq.cookies = { accessToken: 'invalidToken' };
    (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    // Act
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const errorArg = mockNext.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toBe('Invalid or expired access token. Please log in again.');
  });
});
