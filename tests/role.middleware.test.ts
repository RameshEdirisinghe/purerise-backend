import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../src/middleware/role.middleware';
import { ApiError } from '../src/utils/apiResponse';

describe('Role Middleware (High)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow access if user has the correct role', () => {
    mockReq.user = { userId: '123', role: 'admin' };
    const middleware = requireRole('admin', 'projectOwner');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should deny access if user does not have the correct role', () => {
    mockReq.user = { userId: '123', role: 'contributor' };
    const middleware = requireRole('admin', 'projectOwner');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const errorArg = mockNext.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(403);
    expect(errorArg.message).toContain('Access denied');
  });

  it('should deny access if user is not authenticated (no req.user)', () => {
    mockReq.user = undefined;
    const middleware = requireRole('admin');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const errorArg = mockNext.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toBe('Not authenticated');
  });
});
