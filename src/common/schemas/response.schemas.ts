import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API Response wrapper for all endpoints
 * Provides consistent response structure across the application
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message providing additional context',
    example: 'Operation completed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'The actual response data',
    required: false
  })
  data?: T;

  @ApiProperty({
    description: 'Request timestamp in ISO format',
    example: '2024-01-15T10:30:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Unique request identifier for tracking',
    example: 'req_1642248600000_abc123def'
  })
  requestId: string;
}

/**
 * Standard Error Response for failed requests
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Always false for error responses',
    example: false
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Validation failed'
  })
  message: string;

  @ApiProperty({
    description: 'Specific error code for programmatic handling',
    example: 'VALIDATION_ERROR'
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Detailed error information',
    required: false,
    example: [{
      field: 'email',
      message: 'Email must be a valid email address',
      code: 'INVALID_EMAIL'
    }]
  })
  details?: any[];

  @ApiProperty({
    description: 'Request timestamp in ISO format',
    example: '2024-01-15T10:30:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Unique request identifier for tracking',
    example: 'req_1642248600000_abc123def'
  })
  requestId: string;
}

/**
 * Paginated Response wrapper for list endpoints
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({
    description: 'Array of items for current page',
    type: 'array'
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    additionalProperties: false,
    example: {
      page: 1,
      limit: 10,
      total: 150,
      totalPages: 15,
      hasNext: true,
      hasPrev: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Authentication Response with tokens
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer'
  })
  tokenType: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    additionalProperties: false,
    example: {
      id: 'clh7x9k2l0000qh8v4g2m1n3p',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER'
    }
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

/**
 * File Upload Response
 */
export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Uploaded file URL',
    example: 'https://storage.ntumai.com/uploads/documents/doc_123.pdf'
  })
  url: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf'
  })
  filename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  size: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf'
  })
  mimeType: string;

  @ApiProperty({
    description: 'Unique file identifier',
    example: 'file_clh7x9k2l0000qh8v4g2m1n3p'
  })
  fileId: string;
}

/**
 * OTP Response
 */
export class OtpResponseDto {
  @ApiProperty({
    description: 'Request ID for OTP verification',
    example: 'otp_req_clh7x9k2l0000qh8v4g2m1n3p'
  })
  requestId: string;

  @ApiProperty({
    description: 'OTP expiration time in seconds',
    example: 300
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Delivery method used',
    example: 'SMS'
  })
  deliveryMethod: string;

  @ApiProperty({
    description: 'Masked contact information',
    example: '+260***1234'
  })
  maskedContact: string;
}