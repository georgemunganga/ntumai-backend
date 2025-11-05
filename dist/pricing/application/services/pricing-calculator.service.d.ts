import type { IRateTableRepository } from '../../domain/repositories/rate-table.repository.interface';
import { SignatureService } from '../../infrastructure/crypto/signature.service';
import { CalculatePriceDto, CalculatePriceResponseDto } from '../dtos/calculate-price.dto';
export declare class PricingCalculatorService {
    private readonly rateTableRepository;
    private readonly signatureService;
    constructor(rateTableRepository: IRateTableRepository, signatureService: SignatureService);
    calculatePrice(dto: CalculatePriceDto): Promise<CalculatePriceResponseDto>;
    private validateStops;
    private validateScheduling;
    private calculateBreakdown;
    private generateAdvisories;
    getRateTable(region: string, vehicle_type: string): Promise<any>;
    verifySignature(calc_payload: any, sig: string, sig_fields: any): {
        valid: boolean;
        expired: boolean;
    };
}
