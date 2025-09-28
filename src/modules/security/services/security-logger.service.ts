import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { ISecurityLogger, SecurityLogEntry } from '../interfaces/security.interface';

@Injectable()
export class SecurityLogger implements ISecurityLogger {
  private readonly logger = new Logger(SecurityLogger.name);
  private readonly enableDatabaseLogging: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.enableDatabaseLogging = this.configService.get<boolean>('ENABLE_SECURITY_DB_LOGGING', true);
  }

  async logSecurityEvent(
    userId: string | undefined,
    action: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const logEntry: SecurityLogEntry = {
      userId,
      action,
      success,
      metadata,
    };

    // Always log to application logger
    const logMessage = `Security Event: ${action} - User: ${userId || 'anonymous'} - Success: ${success}`;
    
    if (success) {
      this.logger.log(logMessage, { metadata });
    } else {
      this.logger.warn(logMessage, { metadata });
    }

    // Optionally log to database for audit trail
    if (this.enableDatabaseLogging) {
      const securityLogRepository = (this.prisma as any).securityLog;

      if (!securityLogRepository) {
        this.logger.warn('SecurityLog model not found in Prisma client; skipping database logging');
        return;
      }

      try {
        await securityLogRepository.create({
          data: {
            userId,
            action,
            success,
            metadata: metadata ? JSON.stringify(metadata) : null,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error('Failed to log security event to database', error);
      }
    }
  }

  async logOtpGeneration(
    userId: string,
    purpose: string,
    deliveryMethod: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `OTP_GENERATION_${purpose.toUpperCase()}`,
      success,
      {
        ...metadata,
        deliveryMethod,
        purpose,
      },
    );
  }

  async logOtpValidation(
    userId: string,
    purpose: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `OTP_VALIDATION_${purpose.toUpperCase()}`,
      success,
      {
        ...metadata,
        purpose,
      },
    );
  }

  async logPasswordChange(
    userId: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      'PASSWORD_CHANGE',
      success,
      metadata,
    );
  }

  async logPasswordValidation(
    userId: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      'PASSWORD_VALIDATION',
      success,
      metadata,
    );
  }

  async logMfaSetup(
    userId: string,
    mfaType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `MFA_SETUP_${mfaType.toUpperCase()}`,
      success,
      {
        ...metadata,
        mfaType,
      },
    );
  }

  async logMfaValidation(
    userId: string,
    mfaType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `MFA_VALIDATION_${mfaType.toUpperCase()}`,
      success,
      {
        ...metadata,
        mfaType,
      },
    );
  }

  async logTokenGeneration(
    userId: string,
    tokenType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `TOKEN_GENERATION_${tokenType.toUpperCase()}`,
      success,
      {
        ...metadata,
        tokenType,
      },
    );
  }

  async logTokenValidation(
    userId: string,
    tokenType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `TOKEN_VALIDATION_${tokenType.toUpperCase()}`,
      success,
      {
        ...metadata,
        tokenType,
      },
    );
  }

  async logLoginAttempt(
    userId: string | undefined,
    method: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `LOGIN_ATTEMPT_${method.toUpperCase()}`,
      success,
      {
        ...metadata,
        method,
      },
    );
  }

  async logSuspiciousActivity(
    userId: string | undefined,
    activityType: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      `SUSPICIOUS_ACTIVITY_${activityType.toUpperCase()}`,
      false,
      metadata,
    );

    // Also log as error for immediate attention
    this.logger.error(
      `Suspicious Activity Detected: ${activityType} - User: ${userId || 'anonymous'}`,
      { metadata },
    );
  }

  async getSecurityLogs(
    userId?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<SecurityLogEntry[]> {
    if (!this.enableDatabaseLogging) {
      this.logger.warn('Database logging is disabled, cannot retrieve security logs');
      return [];
    }

    const securityLogRepository = (this.prisma as any).securityLog;

    if (!securityLogRepository) {
      this.logger.warn('SecurityLog model not found in Prisma client; returning empty result set');
      return [];
    }

    try {
      const logs = await securityLogRepository.findMany({
        where: {
          ...(userId && { userId }),
          ...(action && { action }),
          ...(startDate && endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map(log => ({
        userId: log.userId,
        action: log.action,
        success: log.success,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve security logs', error);
      return [];
    }
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    if (!this.enableDatabaseLogging) {
      return;
    }

    const securityLogRepository = (this.prisma as any).securityLog;

    if (!securityLogRepository) {
      this.logger.warn('SecurityLog model not found in Prisma client; skipping cleanup');
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await securityLogRepository.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old security log entries`);
    } catch (error) {
      this.logger.error('Failed to cleanup old security logs', error);
    }
  }
}