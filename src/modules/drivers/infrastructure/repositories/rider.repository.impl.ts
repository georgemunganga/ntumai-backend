import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RiderRepository } from '../../domain/repositories/rider.repository';
import { Rider } from '../../domain/entities/rider.entity';
import { VehicleInfo } from '../../domain/value-objects/vehicle-info.vo';
import { Location } from '../../domain/value-objects/location.vo';
import { RiderStatus } from '../../domain/value-objects/rider-status.vo';
import { DocumentStatus } from '../../domain/value-objects/document-status.vo';
import { PerformanceMetrics } from '../../domain/value-objects/performance-metrics.vo';
import { Prisma } from '@prisma/client';

export interface RiderSearchFilters {
  status?: string;
  vehicleType?: string;
  city?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  minRating?: number;
  maxRating?: number;
  joinedAfter?: Date;
  joinedBefore?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface RiderSearchResult {
  riders: Rider[];
  total: number;
}

@Injectable()
export class RiderRepositoryImpl implements RiderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(rider: Rider): Promise<Rider> {
    const riderData = this.mapToRiderData(rider);

    if (rider.getId()) {
      // Update existing rider
      const updatedRider = await this.prisma.rider.update({
        where: { id: rider.getId() },
        data: riderData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedRider);
    } else {
      // Create new rider
      const createdRider = await this.prisma.rider.create({
        data: {
          ...riderData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdRider);
    }
  }

  async findById(id: string): Promise<Rider | null> {
    const rider = await this.prisma.rider.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return rider ? this.mapToDomainEntity(rider) : null;
  }

  async findByUserId(userId: string): Promise<Rider | null> {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
      include: this.getIncludeOptions(),
    });

    return rider ? this.mapToDomainEntity(rider) : null;
  }

  async findByRiderCode(riderCode: string): Promise<Rider | null> {
    const rider = await this.prisma.rider.findUnique({
      where: { riderCode },
      include: this.getIncludeOptions(),
    });

    return rider ? this.mapToDomainEntity(rider) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Rider | null> {
    const rider = await this.prisma.rider.findFirst({
      where: { phoneNumber },
      include: this.getIncludeOptions(),
    });

    return rider ? this.mapToDomainEntity(rider) : null;
  }

  async findByEmail(email: string): Promise<Rider | null> {
    const rider = await this.prisma.rider.findFirst({
      where: { email },
      include: this.getIncludeOptions(),
    });

    return rider ? this.mapToDomainEntity(rider) : null;
  }

  async findAvailableRiders(
    location: Location,
    radiusKm: number,
    vehicleType?: string,
  ): Promise<Rider[]> {
    // Using raw SQL for geospatial queries
    const query = `
      SELECT r.*, u.firstName, u.lastName, u.email, u.phoneNumber
      FROM riders r
      JOIN users u ON r.userId = u.id
      WHERE r.status = 'ONLINE'
        AND r.isAvailable = true
        AND r.isVerified = true
        AND r.currentLatitude IS NOT NULL
        AND r.currentLongitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(r.currentLatitude)) *
            cos(radians(r.currentLongitude) - radians(?)) +
            sin(radians(?)) * sin(radians(r.currentLatitude))
          )
        ) <= ?
        ${vehicleType ? 'AND r.vehicleType = ?' : ''}
      ORDER BY (
        6371 * acos(
          cos(radians(?)) * cos(radians(r.currentLatitude)) *
          cos(radians(r.currentLongitude) - radians(?)) +
          sin(radians(?)) * sin(radians(r.currentLatitude))
        )
      ) ASC
      LIMIT 50
    `;

    const params = [
      location.getLatitude(),
      location.getLongitude(),
      location.getLatitude(),
      radiusKm,
    ];

    if (vehicleType) {
      params.push(vehicleType);
    }

    params.push(
      location.getLatitude(),
      location.getLongitude(),
      location.getLatitude(),
    );

    const riders = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

    return riders.map(rider => this.mapToDomainEntity(rider));
  }

  async searchRiders(
    filters: RiderSearchFilters,
    pagination: PaginationOptions,
  ): Promise<RiderSearchResult> {
    const where: Prisma.RiderWhereInput = {};

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.vehicleType) {
      where.vehicleType = filters.vehicleType as any;
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.minRating !== undefined) {
      where.averageRating = {
        gte: filters.minRating,
      };
    }

    if (filters.maxRating !== undefined) {
      where.averageRating = {
        ...where.averageRating,
        lte: filters.maxRating,
      };
    }

    if (filters.joinedAfter) {
      where.createdAt = {
        gte: filters.joinedAfter,
      };
    }

    if (filters.joinedBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.joinedBefore,
      };
    }

    const [riders, total] = await Promise.all([
      this.prisma.rider.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rider.count({ where }),
    ]);

    return {
      riders: riders.map(rider => this.mapToDomainEntity(rider)),
      total,
    };
  }

  async updateLocation(riderId: string, location: Location): Promise<void> {
    await this.prisma.rider.update({
      where: { id: riderId },
      data: {
        currentLatitude: location.getLatitude(),
        currentLongitude: location.getLongitude(),
        lastLocationUpdate: new Date(),
      },
    });
  }

  async updateStatus(riderId: string, status: RiderStatus): Promise<void> {
    await this.prisma.rider.update({
      where: { id: riderId },
      data: {
        status: status.getStatus() as any,
        isAvailable: status.getIsAvailable(),
        lastStatusUpdate: new Date(),
      },
    });
  }

  async updatePerformanceMetrics(
    riderId: string,
    metrics: PerformanceMetrics,
  ): Promise<void> {
    await this.prisma.rider.update({
      where: { id: riderId },
      data: {
        totalOrders: metrics.getTotalOrders(),
        completedOrders: metrics.getCompletedOrders(),
        cancelledOrders: metrics.getCancelledOrders(),
        averageRating: metrics.getAverageRating(),
        totalRatings: metrics.getTotalRatings(),
        averageDeliveryTime: metrics.getAverageDeliveryTime(),
        onTimeDeliveryRate: metrics.getOnTimeDeliveryRate(),
        totalEarnings: metrics.getTotalEarnings(),
        totalDistance: metrics.getTotalDistance(),
        totalActiveTime: metrics.getTotalActiveTime(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rider.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Rider[]> {
    const riders = await this.prisma.rider.findMany({
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    return riders.map(rider => this.mapToDomainEntity(rider));
  }

  async count(): Promise<number> {
    return this.prisma.rider.count();
  }

  async findActiveRiders(): Promise<Rider[]> {
    const riders = await this.prisma.rider.findMany({
      where: {
        status: {
          in: ['ONLINE', 'BUSY'],
        },
      },
      include: this.getIncludeOptions(),
    });

    return riders.map(rider => this.mapToDomainEntity(rider));
  }

  async findRidersByCity(city: string): Promise<Rider[]> {
    const riders = await this.prisma.rider.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      },
      include: this.getIncludeOptions(),
    });

    return riders.map(rider => this.mapToDomainEntity(rider));
  }

  private getIncludeOptions() {
    return {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          profilePicture: true,
        },
      },
      vehicles: true,
    };
  }

  private mapToRiderData(rider: Rider): Prisma.RiderCreateInput | Prisma.RiderUpdateInput {
    const vehicleInfo = rider.getVehicleInfo();
    const location = rider.getCurrentLocation();
    const status = rider.getStatus();
    const documentStatus = rider.getDocumentStatus();
    const performanceMetrics = rider.getPerformanceMetrics();

    return {
      userId: rider.getUserId(),
      riderCode: rider.getRiderCode(),
      firstName: rider.getFirstName(),
      lastName: rider.getLastName(),
      email: rider.getEmail(),
      phoneNumber: rider.getPhoneNumber(),
      dateOfBirth: rider.getDateOfBirth(),
      profilePicture: rider.getProfilePicture(),
      licenseNumber: rider.getLicenseNumber(),
      licenseExpiryDate: rider.getLicenseExpiryDate(),
      vehicleType: vehicleInfo?.getType() as any,
      vehicleMake: vehicleInfo?.getMake(),
      vehicleModel: vehicleInfo?.getModel(),
      vehicleYear: vehicleInfo?.getYear(),
      vehicleColor: vehicleInfo?.getColor(),
      vehiclePlateNumber: vehicleInfo?.getPlateNumber(),
      insurancePolicyNumber: rider.getInsurancePolicyNumber(),
      insuranceExpiryDate: rider.getInsuranceExpiryDate(),
      emergencyContactName: rider.getEmergencyContactName(),
      emergencyContactPhone: rider.getEmergencyContactPhone(),
      bankAccountNumber: rider.getBankAccountNumber(),
      bankRoutingNumber: rider.getBankRoutingNumber(),
      bankAccountHolderName: rider.getBankAccountHolderName(),
      preferredWorkingHours: rider.getPreferredWorkingHours(),
      serviceAreas: rider.getServiceAreas(),
      status: status.getStatus() as any,
      isAvailable: status.getIsAvailable(),
      isVerified: rider.getIsVerified(),
      verificationDate: rider.getVerificationDate(),
      currentLatitude: location?.getLatitude(),
      currentLongitude: location?.getLongitude(),
      lastLocationUpdate: rider.getLastLocationUpdate(),
      lastStatusUpdate: rider.getLastStatusUpdate(),
      documentsStatus: documentStatus.getStatus(),
      documentsVerifiedAt: documentStatus.getVerifiedAt(),
      documentsRejectedAt: documentStatus.getRejectedAt(),
      documentsRejectionReason: documentStatus.getRejectionReason(),
      totalOrders: performanceMetrics.getTotalOrders(),
      completedOrders: performanceMetrics.getCompletedOrders(),
      cancelledOrders: performanceMetrics.getCancelledOrders(),
      averageRating: performanceMetrics.getAverageRating(),
      totalRatings: performanceMetrics.getTotalRatings(),
      averageDeliveryTime: performanceMetrics.getAverageDeliveryTime(),
      onTimeDeliveryRate: performanceMetrics.getOnTimeDeliveryRate(),
      totalEarnings: performanceMetrics.getTotalEarnings(),
      totalDistance: performanceMetrics.getTotalDistance(),
      totalActiveTime: performanceMetrics.getTotalActiveTime(),
      city: rider.getCity(),
      state: rider.getState(),
      country: rider.getCountry(),
      timezone: rider.getTimezone(),
      language: rider.getLanguage(),
      currency: rider.getCurrency(),
      joinedAt: rider.getJoinedAt(),
    };
  }

  private mapToDomainEntity(data: any): Rider {
    const vehicleInfo = data.vehicleType ? VehicleInfo.create(
      data.vehicleType,
      data.vehicleMake,
      data.vehicleModel,
      data.vehicleYear,
      data.vehicleColor,
      data.vehiclePlateNumber,
    ) : null;

    const location = (data.currentLatitude && data.currentLongitude) ?
      Location.create(data.currentLatitude, data.currentLongitude) : null;

    const status = RiderStatus.create(
      data.status,
      data.isAvailable,
      data.lastStatusUpdate,
    );

    const documentStatus = DocumentStatus.create(
      data.documentsStatus,
      data.documentsVerifiedAt,
      data.documentsRejectedAt,
      data.documentsRejectionReason,
    );

    const performanceMetrics = PerformanceMetrics.create(
      data.totalOrders || 0,
      data.completedOrders || 0,
      data.cancelledOrders || 0,
      data.averageRating || 0,
      data.totalRatings || 0,
      data.averageDeliveryTime || 0,
      data.onTimeDeliveryRate || 0,
      data.totalEarnings || 0,
      data.totalDistance || 0,
      data.totalActiveTime || 0,
    );

    return new Rider(
      data.id,
      data.userId,
      data.riderCode,
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber,
      data.dateOfBirth,
      data.profilePicture,
      data.licenseNumber,
      data.licenseExpiryDate,
      vehicleInfo,
      data.insurancePolicyNumber,
      data.insuranceExpiryDate,
      data.emergencyContactName,
      data.emergencyContactPhone,
      data.bankAccountNumber,
      data.bankRoutingNumber,
      data.bankAccountHolderName,
      data.preferredWorkingHours,
      data.serviceAreas,
      status,
      data.isVerified,
      data.verificationDate,
      location,
      data.lastLocationUpdate,
      data.lastStatusUpdate,
      documentStatus,
      performanceMetrics,
      data.city,
      data.state,
      data.country,
      data.timezone,
      data.language,
      data.currency,
      data.joinedAt,
      data.createdAt,
      data.updatedAt,
    );
  }
}