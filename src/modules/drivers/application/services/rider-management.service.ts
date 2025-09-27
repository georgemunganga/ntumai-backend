import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RiderRepository } from '../../domain/repositories/rider.repository';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { Rider } from '../../domain/entities/rider.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { RiderStatus } from '../../domain/value-objects/rider-status.vo';
import { VehicleInfo } from '../../domain/value-objects/vehicle-info.vo';
import { Location } from '../../domain/value-objects/location.vo';
import { DocumentStatus } from '../../domain/value-objects/document-status.vo';

export interface CreateRiderRequest {
  userId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredVehicleTypes?: string[];
  workingHours?: Record<string, { start: string; end: string }>;
  maxOrdersPerShift?: number;
}

export interface UpdateRiderProfileRequest {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredVehicleTypes?: string[];
  workingHours?: Record<string, { start: string; end: string }>;
  maxOrdersPerShift?: number;
  serviceRadius?: number;
}

export interface UpdateRiderLocationRequest {
  latitude: number;
  longitude: number;
}

export interface RiderProfileResponse {
  id: string;
  userId: string;
  riderCode: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdate: Date;
  };
  serviceRadius: number;
  performanceMetrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    acceptanceRate: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    totalEarnings: number;
    totalDistance: number;
  };
  workingPreferences: {
    preferredVehicleTypes: string[];
    workingHours?: Record<string, { start: string; end: string }>;
    maxOrdersPerShift: number;
  };
  emergencyContact?: {
    name: string;
    phone: string;
  };
  vehicles: VehicleInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RiderStatusUpdateRequest {
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'BREAK';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AddVehicleRequest {
  type: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate: string;
  registrationNumber?: string;
  registrationExpiry?: Date;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: Date;
}

export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  registrationNumber?: string;
  registrationExpiry?: Date;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  mileage?: number;
}

export interface RiderSearchFilters {
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  vehicleType?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  minRating?: number;
  availableForOrders?: boolean;
}

export interface RiderListResponse {
  riders: RiderProfileResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class RiderManagementService {
  constructor(
    private readonly riderRepository: RiderRepository,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async createRider(request: CreateRiderRequest): Promise<RiderProfileResponse> {
    // Check if rider already exists for this user
    const existingRider = await this.riderRepository.findByUserId(request.userId);
    if (existingRider) {
      throw new BadRequestException('Rider profile already exists for this user');
    }

    // Generate unique rider code
    const riderCode = await this.generateUniqueRiderCode();

    // Create rider entity
    const rider = new Rider(
      '', // ID will be generated
      request.userId,
      riderCode,
      RiderStatus.create('OFFLINE'),
      true, // isActive
      false, // isVerified
      null, // verifiedAt
      null, // currentLocation
      request.emergencyContactName,
      request.emergencyContactPhone,
      request.preferredVehicleTypes || [],
      request.workingHours,
      request.maxOrdersPerShift || 20,
      10, // default service radius
    );

    const savedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(savedRider);
  }

  async getRiderProfile(riderId: string): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    return this.mapToRiderProfileResponse(rider);
  }

  async getRiderByUserId(userId: string): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundException('Rider profile not found for this user');
    }

    return this.mapToRiderProfileResponse(rider);
  }

  async updateRiderProfile(
    riderId: string,
    request: UpdateRiderProfileRequest,
  ): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update rider properties
    if (request.emergencyContactName !== undefined) {
      rider.updateEmergencyContact(request.emergencyContactName, request.emergencyContactPhone);
    }

    if (request.preferredVehicleTypes !== undefined) {
      rider.updatePreferredVehicleTypes(request.preferredVehicleTypes);
    }

    if (request.workingHours !== undefined) {
      rider.updateWorkingHours(request.workingHours);
    }

    if (request.maxOrdersPerShift !== undefined) {
      rider.updateMaxOrdersPerShift(request.maxOrdersPerShift);
    }

    if (request.serviceRadius !== undefined) {
      rider.updateServiceRadius(request.serviceRadius);
    }

    const updatedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(updatedRider);
  }

  async updateRiderStatus(
    riderId: string,
    request: RiderStatusUpdateRequest,
  ): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update status
    const newStatus = RiderStatus.create(request.status);
    rider.updateStatus(newStatus);

    // Update location if provided
    if (request.location) {
      const location = Location.create(
        request.location.latitude,
        request.location.longitude,
      );
      rider.updateLocation(location);
    }

    const updatedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(updatedRider);
  }

  async updateRiderLocation(
    riderId: string,
    request: UpdateRiderLocationRequest,
  ): Promise<void> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    const location = Location.create(request.latitude, request.longitude);
    rider.updateLocation(location);

    await this.riderRepository.save(rider);
  }

  async addVehicle(riderId: string, request: AddVehicleRequest): Promise<VehicleInfo> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Check if license plate already exists
    const existingVehicle = await this.vehicleRepository.findByLicensePlate(request.licensePlate);
    if (existingVehicle) {
      throw new BadRequestException('Vehicle with this license plate already exists');
    }

    const vehicleInfo = VehicleInfo.create(
      request.type,
      request.make,
      request.model,
      request.year,
      request.color,
      request.licensePlate,
      request.registrationNumber,
      request.registrationExpiry,
      request.insuranceProvider,
      request.insurancePolicyNumber,
      request.insuranceExpiry,
    );

    const vehicle = new Vehicle(
      '', // ID will be generated
      riderId,
      vehicleInfo,
      true, // isActive
      false, // isVerified
      null, // verifiedAt
      null, // lastMaintenanceDate
      null, // nextMaintenanceDate
      0, // mileage
    );

    const savedVehicle = await this.vehicleRepository.save(vehicle);
    return savedVehicle.getVehicleInfo();
  }

  async updateVehicle(
    riderId: string,
    vehicleId: string,
    request: UpdateVehicleRequest,
  ): Promise<VehicleInfo> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.getRiderId() !== riderId) {
      throw new NotFoundException('Vehicle not found');
    }

    // Update vehicle properties
    if (request.make !== undefined) vehicle.updateMake(request.make);
    if (request.model !== undefined) vehicle.updateModel(request.model);
    if (request.year !== undefined) vehicle.updateYear(request.year);
    if (request.color !== undefined) vehicle.updateColor(request.color);
    if (request.registrationNumber !== undefined) {
      vehicle.updateRegistration(request.registrationNumber, request.registrationExpiry);
    }
    if (request.insuranceProvider !== undefined) {
      vehicle.updateInsurance(
        request.insuranceProvider,
        request.insurancePolicyNumber,
        request.insuranceExpiry,
      );
    }
    if (request.lastMaintenanceDate !== undefined) {
      vehicle.updateMaintenance(request.lastMaintenanceDate, request.nextMaintenanceDate);
    }
    if (request.mileage !== undefined) {
      vehicle.updateMileage(request.mileage);
    }

    const updatedVehicle = await this.vehicleRepository.save(vehicle);
    return updatedVehicle.getVehicleInfo();
  }

  async removeVehicle(riderId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.getRiderId() !== riderId) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.vehicleRepository.delete(vehicleId);
  }

  async getRiderVehicles(riderId: string): Promise<VehicleInfo[]> {
    const vehicles = await this.vehicleRepository.findByRiderId(riderId);
    return vehicles.map(vehicle => vehicle.getVehicleInfo());
  }

  async searchRiders(
    filters: RiderSearchFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<RiderListResponse> {
    const { riders, total } = await this.riderRepository.searchRiders(filters, {
      page,
      limit,
    });

    const riderResponses = riders.map(rider => this.mapToRiderProfileResponse(rider));

    return {
      riders: riderResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async activateRider(riderId: string): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    rider.activate();
    const updatedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(updatedRider);
  }

  async deactivateRider(riderId: string): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    rider.deactivate();
    const updatedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(updatedRider);
  }

  async verifyRider(riderId: string): Promise<RiderProfileResponse> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    rider.verify();
    const updatedRider = await this.riderRepository.save(rider);
    return this.mapToRiderProfileResponse(updatedRider);
  }

  private async generateUniqueRiderCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = `R${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const existingRider = await this.riderRepository.findByRiderCode(code);
      isUnique = !existingRider;
    }

    return code!;
  }

  private async mapToRiderProfileResponse(rider: Rider): Promise<RiderProfileResponse> {
    const vehicles = await this.vehicleRepository.findByRiderId(rider.getId());
    const vehicleInfos = vehicles.map(vehicle => vehicle.getVehicleInfo());

    return {
      id: rider.getId(),
      userId: rider.getUserId(),
      riderCode: rider.getRiderCode(),
      status: rider.getStatus().getValue(),
      isActive: rider.getIsActive(),
      isVerified: rider.getIsVerified(),
      verifiedAt: rider.getVerifiedAt(),
      currentLocation: rider.getCurrentLocation() ? {
        latitude: rider.getCurrentLocation()!.getLatitude(),
        longitude: rider.getCurrentLocation()!.getLongitude(),
        lastUpdate: rider.getLastLocationUpdate()!,
      } : undefined,
      serviceRadius: rider.getServiceRadius(),
      performanceMetrics: {
        totalOrders: rider.getTotalOrders(),
        completedOrders: rider.getCompletedOrders(),
        cancelledOrders: rider.getCancelledOrders(),
        acceptanceRate: rider.getAcceptanceRate(),
        completionRate: rider.getCompletionRate(),
        averageRating: rider.getAverageRating(),
        totalRatings: rider.getTotalRatings(),
        totalEarnings: rider.getTotalEarnings(),
        totalDistance: rider.getTotalDistance(),
      },
      workingPreferences: {
        preferredVehicleTypes: rider.getPreferredVehicleTypes(),
        workingHours: rider.getWorkingHours(),
        maxOrdersPerShift: rider.getMaxOrdersPerShift(),
      },
      emergencyContact: rider.getEmergencyContactName() ? {
        name: rider.getEmergencyContactName()!,
        phone: rider.getEmergencyContactPhone()!,
      } : undefined,
      vehicles: vehicleInfos,
      createdAt: rider.getCreatedAt(),
      updatedAt: rider.getUpdatedAt(),
    };
  }
}