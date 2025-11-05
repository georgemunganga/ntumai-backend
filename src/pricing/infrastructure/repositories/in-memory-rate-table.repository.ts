import { Injectable } from '@nestjs/common';
import { IRateTableRepository } from '../../domain/repositories/rate-table.repository.interface';
import { RateTable } from '../../domain/entities/rate-table.entity';

@Injectable()
export class InMemoryRateTableRepository implements IRateTableRepository {
  private rateTables: Map<string, RateTable> = new Map();

  constructor() {
    this.seedDefaultRates();
  }

  async findByRegionAndVehicle(
    region: string,
    vehicle_type: string,
  ): Promise<RateTable | null> {
    const key = `${region}_${vehicle_type}`;
    return this.rateTables.get(key) || null;
  }

  async findAll(): Promise<RateTable[]> {
    return Array.from(this.rateTables.values()).filter((rt) => rt.active);
  }

  async save(rateTable: RateTable): Promise<RateTable> {
    const key = `${rateTable.region}_${rateTable.vehicle_type}`;
    this.rateTables.set(key, rateTable);
    return rateTable;
  }

  async update(
    rate_table_id: string,
    updates: Partial<RateTable>,
  ): Promise<RateTable> {
    const existing = Array.from(this.rateTables.values()).find(
      (rt) => rt.rate_table_id === rate_table_id,
    );

    if (!existing) {
      throw new Error('Rate table not found');
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      updates,
      { updated_at: new Date() },
    );

    const key = `${updated.region}_${updated.vehicle_type}`;
    this.rateTables.set(key, updated);
    return updated;
  }

  async delete(rate_table_id: string): Promise<void> {
    const existing = Array.from(this.rateTables.entries()).find(
      ([_, rt]) => rt.rate_table_id === rate_table_id,
    );

    if (existing) {
      this.rateTables.delete(existing[0]);
    }
  }

  private seedDefaultRates(): void {
    // Zambia - Lusaka - Motorbike
    const zmLskMotorbike = RateTable.create({
      region: 'ZM-LSK',
      vehicle_type: 'motorbike',
      currency: 'ZMW',
      included_km: 2.0,
      base: 25.0,
      per_km: 3.6,
      per_min: 0.25,
      multistop_fee: 5.0,
      vehicle_surcharge: 0.0,
      service_levels: { standard: 1.0, express: 1.25 },
      platform_fee: 3.0,
      small_order_threshold: 20.0,
      small_order_fee: 5.0,
      vat_rate: 0.16,
      surge: { mode: 'factor', factor: 1.2, applies_to: 'distance+duration' },
      limits: { max_stops: 8, max_weight_kg: 15, max_volume_l: 45 },
      ttl_seconds: 900,
    });

    // Zambia - Lusaka - Bicycle
    const zmLskBicycle = RateTable.create({
      region: 'ZM-LSK',
      vehicle_type: 'bicycle',
      currency: 'ZMW',
      included_km: 1.5,
      base: 15.0,
      per_km: 2.5,
      per_min: 0.2,
      multistop_fee: 3.0,
      vehicle_surcharge: 0.0,
      service_levels: { standard: 1.0 },
      platform_fee: 2.0,
      small_order_threshold: 15.0,
      small_order_fee: 3.0,
      vat_rate: 0.16,
      surge: { mode: 'factor', factor: 1.1, applies_to: 'subtotal' },
      limits: { max_stops: 5, max_weight_kg: 8, max_volume_l: 25 },
      ttl_seconds: 900,
    });

    // Zambia - Lusaka - Truck
    const zmLskTruck = RateTable.create({
      region: 'ZM-LSK',
      vehicle_type: 'truck',
      currency: 'ZMW',
      included_km: 3.0,
      base: 80.0,
      per_km: 8.0,
      per_min: 0.5,
      multistop_fee: 15.0,
      vehicle_surcharge: 20.0,
      service_levels: { standard: 1.0, express: 1.3 },
      platform_fee: 10.0,
      small_order_threshold: 50.0,
      small_order_fee: 0.0,
      vat_rate: 0.16,
      surge: { mode: 'factor', factor: 1.15, applies_to: 'distance+duration' },
      limits: { max_stops: 10, max_weight_kg: 500, max_volume_l: 2000 },
      ttl_seconds: 900,
    });

    this.rateTables.set('ZM-LSK_motorbike', zmLskMotorbike);
    this.rateTables.set('ZM-LSK_bicycle', zmLskBicycle);
    this.rateTables.set('ZM-LSK_truck', zmLskTruck);
  }
}
