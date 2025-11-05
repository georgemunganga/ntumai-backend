import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignatureService {
  private readonly secret: string;
  private readonly keyId: string;

  constructor(private configService: ConfigService) {
    this.secret =
      this.configService.get<string>('PRICING_HMAC_SECRET') ||
      'pricing-calculator-secret-2025-change-in-production';
    this.keyId =
      this.configService.get<string>('PRICING_KEY_ID') || 'calc_key_2025_10';
  }

  /**
   * Generate HMAC-SHA256 signature for pricing calculation
   */
  sign(
    canonicalPayload: string,
    ttlSeconds: number,
  ): {
    sig: string;
    sig_fields: {
      alg: string;
      key_id: string;
      issued_at: string;
      ttl_seconds: number;
      canon_hash: string;
    };
  } {
    const issued_at = new Date().toISOString();
    const canon_hash = this.hashCanonical(canonicalPayload);

    const signatureData = JSON.stringify({
      key_id: this.keyId,
      issued_at,
      ttl_seconds: ttlSeconds,
      canon_hash,
    });

    const hmac = createHmac('sha256', this.secret);
    hmac.update(signatureData);
    const sig = `pc.sig.v1.${hmac.digest('base64')}`;

    return {
      sig,
      sig_fields: {
        alg: 'HMAC-SHA256',
        key_id: this.keyId,
        issued_at,
        ttl_seconds: ttlSeconds,
        canon_hash,
      },
    };
  }

  /**
   * Verify HMAC signature
   */
  verify(
    canonicalPayload: string,
    sig: string,
    sig_fields: {
      key_id: string;
      issued_at: string;
      ttl_seconds: number;
      canon_hash: string;
    },
  ): boolean {
    try {
      // Check if signature format is correct
      if (!sig.startsWith('pc.sig.v1.')) {
        return false;
      }

      // Check if key_id matches
      if (sig_fields.key_id !== this.keyId) {
        return false;
      }

      // Verify canonical hash
      const expectedHash = this.hashCanonical(canonicalPayload);
      if (sig_fields.canon_hash !== expectedHash) {
        return false;
      }

      // Recompute signature
      const signatureData = JSON.stringify({
        key_id: sig_fields.key_id,
        issued_at: sig_fields.issued_at,
        ttl_seconds: sig_fields.ttl_seconds,
        canon_hash: sig_fields.canon_hash,
      });

      const hmac = createHmac('sha256', this.secret);
      hmac.update(signatureData);
      const expectedSig = `pc.sig.v1.${hmac.digest('base64')}`;

      return sig === expectedSig;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if signature has expired based on TTL
   */
  isExpired(issued_at: string, ttl_seconds: number): boolean {
    const issuedTime = new Date(issued_at).getTime();
    const expiryTime = issuedTime + ttl_seconds * 1000;
    return Date.now() > expiryTime;
  }

  /**
   * Hash canonical payload using SHA-256
   */
  private hashCanonical(payload: string): string {
    const hash = createHash('sha256');
    hash.update(payload);
    return `sha256:${hash.digest('hex').substring(0, 16)}`;
  }
}
