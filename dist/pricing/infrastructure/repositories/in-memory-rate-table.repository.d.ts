import { IRateTableRepository } from '../../domain/repositories/rate-table.repository.interface';
import { RateTable } from '../../domain/entities/rate-table.entity';
export declare class InMemoryRateTableRepository implements IRateTableRepository {
    private rateTables;
    constructor();
    findByRegionAndVehicle(region: string, vehicle_type: string): Promise<RateTable | null>;
    findAll(): Promise<RateTable[]>;
    save(rateTable: RateTable): Promise<RateTable>;
    update(rate_table_id: string, updates: Partial<RateTable>): Promise<RateTable>;
    delete(rate_table_id: string): Promise<void>;
    private seedDefaultRates;
}
