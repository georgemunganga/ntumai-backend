import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleInfo } from '../../domain/value-objects/vehicle-info.vo';
import { Prisma } from '@prisma/client';

export interface VehicleSearchFilters {
  riderId?: string;
  type?: string;
  make?: string;
  model?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  color?: string;
  plateNumber?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface VehicleSearchResult {
  vehicles: Vehicle[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class VehicleRepositoryImpl implements VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const vehicleData = this.mapToVehicleData(vehicle);

    if (vehicle.getId()) {
      // Update existing vehicle
      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicle.getId() },
        data: vehicleData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedVehicle);
    } else {
      // Create new vehicle
      const createdVehicle = await this.prisma.vehicle.create({
        data: {
          ...vehicleData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdVehicle);
    }
  }

  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return vehicle ? this.mapToDomainEntity(vehicle) : null;
  }

  async findByRiderId(riderId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { riderId },
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async findByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { plateNumber },
      include: this.getIncludeOptions(),
    });

    return vehicle ? this.mapToDomainEntity(vehicle) : null;
  }

  async findActiveVehiclesByRiderId(riderId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        riderId,
        isActive: true,
      },
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async findVerifiedVehiclesByRiderId(riderId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        riderId,
        isVerified: true,
      },
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async searchVehicles(
    filters: VehicleSearchFilters,
    pagination: PaginationOptions,
  ): Promise<VehicleSearchResult> {
    const where: Prisma.VehicleWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.make) {
      where.make = {
        contains: filters.make,
        mode: 'insensitive',
      };
    }

    if (filters.model) {
      where.model = {
        contains: filters.model,
        mode: 'insensitive',
      };
    }

    if (filters.year) {
      where.year = filters.year;
    }

    if (filters.minYear !== undefined) {
      where.year = {
        ...where.year,
        gte: filters.minYear,
      };
    }

    if (filters.maxYear !== undefined) {
      where.year = {
        ...where.year,
        lte: filters.maxYear,
      };
    }

    if (filters.color) {
      where.color = {
        contains: filters.color,
        mode: 'insensitive',
      };
    }

    if (filters.plateNumber) {
      where.plateNumber = {
        contains: filters.plateNumber,
        mode: 'insensitive',
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles: vehicles.map(vehicle => this.mapToDomainEntity(vehicle)),
      total,
    };
  }

  async findVehiclesByType(type: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        type: type as any,
        isActive: true,
        isVerified: true,
      },
      include: this.getIncludeOptions(),
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async findExpiredInsuranceVehicles(): Promise<Vehicle[]> {
    const currentDate = new Date();
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        insuranceExpiryDate: {
          lte: currentDate,
        },
        isActive: true,
      },
      include: this.getIncludeOptions(),
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async findExpiredRegistrationVehicles(): Promise<Vehicle[]> {
    const currentDate = new Date();
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        registrationExpiryDate: {
          lte: currentDate,
        },
        isActive: true,
      },
      include: this.getIncludeOptions(),
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async updateVerificationStatus(
    vehicleId: string,
    isVerified: boolean,
    verificationDate?: Date,
    verificationNotes?: string,
  ): Promise<void> {
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        isVerified,
        verificationDate: verificationDate || (isVerified ? new Date() : null),
        verificationNotes,
      },
    });
  }

  async updateActiveStatus(vehicleId: string, isActive: boolean): Promise<void> {
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        isActive,
        deactivatedAt: isActive ? null : new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(vehicle => this.mapToDomainEntity(vehicle));
  }

  async count(): Promise<number> {
    return this.prisma.vehicle.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.vehicle.count({
      where: { riderId },
    });
  }

  async countActiveVehicles(): Promise<number> {
    return this.prisma.vehicle.count({
      where: { isActive: true },
    });
  }

  async countVerifiedVehicles(): Promise<number> {
    return this.prisma.vehicle.count({
      where: { isVerified: true },
    });
  }

  private getIncludeOptions() {
    return {
      rider: {
        select: {
          id: true,
          riderCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
    };
  }

  private mapToVehicleData(vehicle: Vehicle): Prisma.VehicleCreateInput | Prisma.VehicleUpdateInput {
    const vehicleInfo = vehicle.getVehicleInfo();

    return {
      riderId: vehicle.getRiderId(),
      type: vehicleInfo.getType() as any,
      make: vehicleInfo.getMake(),
      model: vehicleInfo.getModel(),
      year: vehicleInfo.getYear(),
      color: vehicleInfo.getColor(),
      plateNumber: vehicleInfo.getPlateNumber(),
      vinNumber: vehicle.getVinNumber(),
      registrationNumber: vehicle.getRegistrationNumber(),
      registrationExpiryDate: vehicle.getRegistrationExpiryDate(),
      insurancePolicyNumber: vehicle.getInsurancePolicyNumber(),
      insuranceProvider: vehicle.getInsuranceProvider(),
      insuranceExpiryDate: vehicle.getInsuranceExpiryDate(),
      inspectionExpiryDate: vehicle.getInspectionExpiryDate(),
      isActive: vehicle.getIsActive(),
      isVerified: vehicle.getIsVerified(),
      verificationDate: vehicle.getVerificationDate(),
      verificationNotes: vehicle.getVerificationNotes(),
      deactivatedAt: vehicle.getDeactivatedAt(),
      photos: vehicle.getPhotos(),
      documents: vehicle.getDocuments(),
    };
  }

  private mapToDomainEntity(data: any): Vehicle {
    const vehicleInfo = VehicleInfo.create(
      data.type,
      data.make,
      data.model,
      data.year,
      data.color,
      data.plateNumber,
    );

    return new Vehicle(
      data.id,
      data.riderId,
      vehicleInfo,
      data.vinNumber,
      data.registrationNumber,
      data.registrationExpiryDate,
      data.insurancePolicyNumber,
      data.insuranceProvider,
      data.insuranceExpiryDate,
      data.inspectionExpiryDate,
      data.isActive,
      data.isVerified,
      data.verificationDate,
      data.verificationNotes,
      data.deactivatedAt,
      data.photos,
      data.documents,
      data.createdAt,
      data.updatedAt,
    );
  }
}