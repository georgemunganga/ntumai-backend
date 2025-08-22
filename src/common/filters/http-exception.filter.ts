import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.headers['x-request-id'] || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_SERVER_ERROR';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = this.getErrorCode(status, responseObj.error);
        
        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          details = responseObj.message.map((msg: string) => ({
            field: this.extractFieldFromMessage(msg),
            message: msg,
            code: 'VALIDATION_ERROR'
          }));
          message = 'Validation failed';
        }
      } else {
        message = exceptionResponse as string || exception.message;
        error = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = 'INTERNAL_SERVER_ERROR';
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
      `CorrelationId: ${correlationId}`
    );

    // Set correlation ID header
    response.setHeader('X-Request-ID', correlationId);

    // Standard error response format
    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        message,
        code: error,
        ...(details.length > 0 && { details }),
        timestamp: new Date().toISOString(),
        path: request.url,
        correlationId
      }
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number, errorType?: string): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR'
    };

    // Handle specific auth error codes
    if (status === 401) {
      if (errorType?.includes('credentials')) return 'INVALID_CREDENTIALS';
      if (errorType?.includes('token')) return 'INVALID_TOKEN';
      if (errorType?.includes('expired')) return 'TOKEN_EXPIRED';
    }

    if (status === 409) {
      if (errorType?.includes('email') || errorType?.includes('user')) {
        return 'USER_ALREADY_EXISTS';
      }
    }

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private extractFieldFromMessage(message: string): string {
    // Extract field name from validation messages like "email must be a valid email"
    const fieldMatch = message.match(/^(\w+)\s/);
    return fieldMatch ? fieldMatch[1] : 'unknown';
  }
}