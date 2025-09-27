import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for token refresh operations
 * Used to obtain new access tokens using a valid refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid JWT refresh token obtained during login - used to generate new access tokens without re-authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGg3eDlrMmwwMDAwcWg4djRnMm0xbjNwIiwiaWF0IjoxNjg5NzY5MjAwLCJleHAiOjE2OTIzNjEyMDB9.signature',
    format: 'jwt',
    pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$'
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}