import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IMfaService, MfaSetupResult } from '../interfaces/security.interface';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class MfaService implements IMfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly appName: string;
  private readonly issuer: string;
  private readonly fallbackStore = new Map<
    string,
    { totpSecret: string; backupCodes: string[]; isEnabled: boolean }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('APP_NAME', 'NtumaI');
    this.issuer = this.configService.get<string>('MFA_ISSUER', 'NtumaI Security');
  }

  private get userMfaRepository(): any | null {
    return (this.prisma as any).userMfa ?? null;
  }

  async setupTotp(userId: string): Promise<MfaSetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.appName} (${userId})`,
        issuer: this.issuer,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.createBackupCodes();
      const hashedCodes = backupCodes.map(code => this.hashBackupCode(code));

      // Store MFA setup
      const repository = this.userMfaRepository;
      if (repository) {
        await repository.upsert({
          where: { userId },
          update: {
            totpSecret: secret.base32,
            backupCodes: hashedCodes,
            isEnabled: false, // Will be enabled after first successful verification
            updatedAt: new Date(),
          },
          create: {
            userId,
            totpSecret: secret.base32,
            backupCodes: hashedCodes,
            isEnabled: false,
          },
        });
      } else {
        this.fallbackStore.set(userId, {
          totpSecret: secret.base32,
          backupCodes: hashedCodes,
          isEnabled: false,
        });
      }

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      this.logger.log(`MFA setup initiated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      this.logger.error(`Failed to setup MFA for user ${userId}`, error);
      throw new Error('MFA setup failed');
    }
  }

  async verifyTotp(userId: string, token: string): Promise<boolean> {
    try {
      const repository = this.userMfaRepository;
      const mfaRecord = repository
        ? await repository.findUnique({ where: { userId } })
        : this.fallbackStore.get(userId);

      if (!mfaRecord || !mfaRecord.totpSecret) {
        this.logger.warn(`No MFA setup found for user ${userId}`);
        return false;
      }

      // Verify TOTP token
      const isValid = speakeasy.totp.verify({
        secret: mfaRecord.totpSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before and after current time
      });

      if (isValid && !mfaRecord.isEnabled) {
        if (repository) {
          await repository.update({
            where: { userId },
            data: { isEnabled: true },
          });
        } else {
          this.fallbackStore.set(userId, {
            ...mfaRecord,
            isEnabled: true,
          });
        }

        this.logger.log(`MFA enabled for user ${userId}`);
      }

      this.logger.log(`TOTP verification for user ${userId}: ${isValid ? 'success' : 'failed'}`);
      return isValid;
    } catch (error) {
      this.logger.error(`Failed to verify TOTP for user ${userId}`, error);
      return false;
    }
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.createBackupCodes();
      const hashedCodes = backupCodes.map(code => this.hashBackupCode(code));

      const repository = this.userMfaRepository;
      if (repository) {
        await repository.update({
          where: { userId },
          data: {
            backupCodes: hashedCodes,
            updatedAt: new Date(),
          },
        });
      } else {
        const existing = this.fallbackStore.get(userId);
        if (!existing) {
          throw new Error('MFA setup not found');
        }
        this.fallbackStore.set(userId, {
          ...existing,
          backupCodes: hashedCodes,
        });
      }

      this.logger.log(`New backup codes generated for user ${userId}`);
      return backupCodes;
    } catch (error) {
      this.logger.error(`Failed to generate backup codes for user ${userId}`, error);
      throw new Error('Backup code generation failed');
    }
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const repository = this.userMfaRepository;
      const mfaRecord = repository
        ? await repository.findUnique({ where: { userId } })
        : this.fallbackStore.get(userId);

      if (!mfaRecord || !mfaRecord.backupCodes) {
        this.logger.warn(`No backup codes found for user ${userId}`);
        return false;
      }

      const hashedCode = this.hashBackupCode(code);
      const codeIndex = mfaRecord.backupCodes.indexOf(hashedCode);

      if (codeIndex === -1) {
        this.logger.warn(`Invalid backup code for user ${userId}`);
        return false;
      }

      // Remove used backup code
      const updatedCodes = [...mfaRecord.backupCodes];
      updatedCodes.splice(codeIndex, 1);

      if (repository) {
        await repository.update({
          where: { userId },
          data: {
            backupCodes: updatedCodes,
            updatedAt: new Date(),
          },
        });
      } else {
        this.fallbackStore.set(userId, {
          ...mfaRecord,
          backupCodes: updatedCodes,
        });
      }

      this.logger.log(`Backup code used successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify backup code for user ${userId}`, error);
      return false;
    }
  }

  async disableMfa(userId: string): Promise<void> {
    try {
      const repository = this.userMfaRepository;
      if (repository) {
        await repository.delete({
          where: { userId },
        });
      }

      this.fallbackStore.delete(userId);

      this.logger.log(`MFA disabled for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to disable MFA for user ${userId}`, error);
      throw new Error('MFA disable failed');
    }
  }

  private createBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}