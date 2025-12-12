import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] || nanoid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        errorCode = responseObj.error || responseObj.code || exception.name;
        message =
          responseObj.message ||
          (Array.isArray(responseObj.message)
            ? responseObj.message.join(', ')
            : exception.message);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: request.url,
      },
    };

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${errorCode} - Message: ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}
