import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    // Generate or use existing correlation ID
    const correlationId = request.headers['x-request-id'] || uuidv4();
    response.setHeader('X-Request-ID', correlationId);
    
    // Add security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    
    return next.handle().pipe(
      map((data) => {
        // If data is already in the correct format, just add metadata
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            correlationId,
            ...(this.shouldAddExpiresIn(request, data) && {
              expiresIn: this.getTokenExpiresIn()
            })
          };
        }
        
        // Wrap other responses in standard format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          correlationId,
          ...(this.shouldAddExpiresIn(request, data) && {
            expiresIn: this.getTokenExpiresIn()
          })
        };
      })
    );
  }
  
  private shouldAddExpiresIn(request: Request, data: any): boolean {
    // Add expiresIn for token-related endpoints
    const tokenEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isTokenEndpoint = tokenEndpoints.some(endpoint => 
      request.url.includes(endpoint)
    );
    
    // Check if response contains tokens
    const hasTokens = data?.data?.tokens || data?.data?.accessToken;
    
    return isTokenEndpoint && hasTokens;
  }
  
  private getTokenExpiresIn(): number {
    // Default to 7 days in seconds (should match JWT configuration)
    return 7 * 24 * 60 * 60; // 604800 seconds
  }
}