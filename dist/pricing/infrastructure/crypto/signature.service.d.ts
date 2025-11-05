import { ConfigService } from '@nestjs/config';
export declare class SignatureService {
    private configService;
    private readonly secret;
    private readonly keyId;
    constructor(configService: ConfigService);
    sign(canonicalPayload: string, ttlSeconds: number): {
        sig: string;
        sig_fields: {
            alg: string;
            key_id: string;
            issued_at: string;
            ttl_seconds: number;
            canon_hash: string;
        };
    };
    verify(canonicalPayload: string, sig: string, sig_fields: {
        key_id: string;
        issued_at: string;
        ttl_seconds: number;
        canon_hash: string;
    }): boolean;
    isExpired(issued_at: string, ttl_seconds: number): boolean;
    private hashCanonical;
}
