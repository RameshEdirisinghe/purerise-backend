export class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export class ApiError extends Error {
  statusCode: number;
  errors: string[];
  isOperational: boolean;

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
