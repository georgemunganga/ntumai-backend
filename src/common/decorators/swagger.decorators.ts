import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Common Swagger response decorators for API documentation
 */

export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['Validation failed'],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
          error: { type: 'string', example: 'Internal Server Error' },
        },
      },
    }),
  );
}

export function ApiAuthResponses() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
    ApiCommonResponses(),
  );
}

export function ApiRoleResponses(roles: string[]) {
  return applyDecorators(
    ApiAuthResponses(),
    ApiResponse({
      status: 403,
      description: `Forbidden - Requires one of the following roles: ${roles.join(', ')}`,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: {
            type: 'string',
            example: 'Forbidden - Insufficient permissions',
          },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
  );
}

export function ApiCustomerOnly() {
  return ApiRoleResponses(['CUSTOMER']);
}

export function ApiTaskerOnly() {
  return ApiRoleResponses(['TASKER']);
}

export function ApiVendorOnly() {
  return ApiRoleResponses(['VENDOR']);
}

export function ApiCustomerOrTasker() {
  return ApiRoleResponses(['CUSTOMER', 'TASKER']);
}

export function ApiNotFoundResponse(resource: string) {
  return ApiResponse({
    status: 404,
    description: `${resource} not found`,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: `${resource} not found` },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  });
}

export function ApiCreatedResponse(description: string, type?: any) {
  return ApiResponse({
    status: 201,
    description,
    type,
  });
}

export function ApiSuccessResponse(description: string, type?: any) {
  return ApiResponse({
    status: 200,
    description,
    type,
  });
}
