import { PricingCalculatorService } from '../../application/services/pricing-calculator.service';
import { CalculatePriceDto, CalculatePriceResponseDto } from '../../application/dtos/calculate-price.dto';
export declare class PricingController {
    private readonly pricingCalculatorService;
    constructor(pricingCalculatorService: PricingCalculatorService);
    calculatePrice(dto: CalculatePriceDto): Promise<CalculatePriceResponseDto>;
    getRateTable(region: string, vehicle_type: string): Promise<any>;
    health(): Promise<{
        status: string;
    }>;
    availability(): Promise<{
        available: boolean;
    }>;
}
