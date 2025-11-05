import { RateTable } from '../entities/rate-table.entity';
export interface IRateTableRepository {
    findByRegionAndVehicle(region: string, vehicle_type: string): Promise<RateTable | null>;
    findAll(): Promise<RateTable[]>;
    save(rateTable: RateTable): Promise<RateTable>;
    update(rate_table_id: string, updates: Partial<RateTable>): Promise<RateTable>;
    delete(rate_table_id: string): Promise<void>;
}
export declare const RATE_TABLE_REPOSITORY: unique symbol;
