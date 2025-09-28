import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { IncidentRepository } from '../../domain/repositories/incident.repository';
import { Incident } from '../../domain/entities/incident.entity';
import { Location } from '../../domain/value-objects/location.vo';
import { Prisma } from '@prisma/client';

export interface IncidentSearchFilters {
  riderId?: string;
  orderId?: string;
  shiftId?: string;
  type?: string;
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  reportedBy?: string;
  assignedTo?: string;
  city?: string;
}

export interface IncidentSearchResult {
  incidents: Incident[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface IncidentSummary {
  period: string;
  totalIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  averageResolutionTime: number;
}

@Injectable()
export class IncidentRepositoryImpl implements IncidentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(incident: Incident): Promise<Incident> {
    const incidentData = this.mapToIncidentData(incident);

    if (incident.getId()) {
      // Update existing incident
      const updatedIncident = await this.prisma.incident.update({
        where: { id: incident.getId() },
        data: incidentData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedIncident);
    } else {
      // Create new incident
      const createdIncident = await this.prisma.incident.create({
        data: {
          ...incidentData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdIncident);
    }
  }

  async findById(id: string): Promise<Incident | null> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return incident ? this.mapToDomainEntity(incident) : null;
  }

  async findByRiderId(
    riderId: string,
    pagination?: PaginationOptions,
  ): Promise<IncidentSearchResult> {
    const where: Prisma.IncidentWhereInput = { riderId };

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      incidents: incidents.map(incident => this.mapToDomainEntity(incident)),
      total,
    };
  }

  async findByOrderId(orderId: string): Promise<Incident[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { orderId },
      include: this.getIncludeOptions(),
      orderBy: { reportedAt: 'desc' },
    });

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async findByShiftId(shiftId: string): Promise<Incident[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { shiftId },
      include: this.getIncludeOptions(),
      orderBy: { reportedAt: 'desc' },
    });

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async findByStatus(
    status: string,
    pagination?: PaginationOptions,
  ): Promise<IncidentSearchResult> {
    const where: Prisma.IncidentWhereInput = { status: status as any };

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      incidents: incidents.map(incident => this.mapToDomainEntity(incident)),
      total,
    };
  }

  async findBySeverity(
    severity: string,
    pagination?: PaginationOptions,
  ): Promise<IncidentSearchResult> {
    const where: Prisma.IncidentWhereInput = { severity: severity as any };

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      incidents: incidents.map(incident => this.mapToDomainEntity(incident)),
      total,
    };
  }

  async searchIncidents(
    filters: IncidentSearchFilters,
    pagination: PaginationOptions,
  ): Promise<IncidentSearchResult> {
    const where: Prisma.IncidentWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.shiftId) {
      where.shiftId = filters.shiftId;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.severity) {
      where.severity = filters.severity as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate) {
      where.reportedAt = {
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.reportedAt = {
        ...where.reportedAt,
        lte: filters.endDate,
      };
    }

    if (filters.reportedBy) {
      where.reportedBy = filters.reportedBy;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      incidents: incidents.map(incident => this.mapToDomainEntity(incident)),
      total,
    };
  }

  async getIncidentSummary(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
    riderId?: string,
  ): Promise<IncidentSummary[]> {
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const riderCondition = riderId ? 'AND rider_id = ?' : '';
    const params = [startDate, endDate];
    if (riderId) {
      params.push(riderId);
    }

    const query = `
      SELECT 
        DATE_FORMAT(reported_at, '${dateFormat}') as period,
        COUNT(*) as totalIncidents,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as criticalIncidents,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as highIncidents,
        SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as mediumIncidents,
        SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as lowIncidents,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolvedIncidents,
        SUM(CASE WHEN status IN ('REPORTED', 'INVESTIGATING', 'IN_PROGRESS') THEN 1 ELSE 0 END) as pendingIncidents,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, reported_at, resolved_at) ELSE NULL END) as averageResolutionTime
      FROM incidents 
      WHERE reported_at >= ? 
        AND reported_at <= ?
        ${riderCondition}
      GROUP BY DATE_FORMAT(reported_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

    return results.map(result => ({
      period: result.period,
      totalIncidents: Number(result.totalIncidents) || 0,
      criticalIncidents: Number(result.criticalIncidents) || 0,
      highIncidents: Number(result.highIncidents) || 0,
      mediumIncidents: Number(result.mediumIncidents) || 0,
      lowIncidents: Number(result.lowIncidents) || 0,
      resolvedIncidents: Number(result.resolvedIncidents) || 0,
      pendingIncidents: Number(result.pendingIncidents) || 0,
      averageResolutionTime: Number(result.averageResolutionTime) || 0,
    }));
  }

  async findCriticalIncidents(): Promise<Incident[]> {
    const incidents = await this.prisma.incident.findMany({
      where: {
        severity: 'CRITICAL',
        status: {
          in: ['REPORTED', 'INVESTIGATING', 'IN_PROGRESS'],
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { reportedAt: 'asc' },
    });

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async findUnresolvedIncidents(
    olderThanHours: number = 24,
  ): Promise<Incident[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const incidents = await this.prisma.incident.findMany({
      where: {
        status: {
          in: ['REPORTED', 'INVESTIGATING', 'IN_PROGRESS'],
        },
        reportedAt: {
          lte: cutoffDate,
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { reportedAt: 'asc' },
    });

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async findIncidentsByLocation(
    location: Location,
    radiusKm: number,
  ): Promise<Incident[]> {
    // Using raw SQL for geospatial queries
    const query = `
      SELECT *
      FROM incidents
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          )
        ) <= ?
      ORDER BY reported_at DESC
      LIMIT 50
    `;

    const incidents = await this.prisma.$queryRawUnsafe(
      query,
      location.getLatitude(),
      location.getLongitude(),
      location.getLatitude(),
      radiusKm,
    ) as any[];

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async updateIncidentStatus(
    incidentId: string,
    status: string,
    assignedTo?: string,
    notes?: string,
  ): Promise<void> {
    const updateData: any = { status };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    if (notes) {
      updateData.adminNotes = notes;
    }

    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: updateData,
    });
  }

  async updateIncidentLocation(
    incidentId: string,
    location: Location,
  ): Promise<void> {
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        latitude: location.getLatitude(),
        longitude: location.getLongitude(),
      },
    });
  }

  async addIncidentNote(
    incidentId: string,
    note: string,
    addedBy: string,
  ): Promise<void> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      select: { adminNotes: true },
    });

    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${addedBy}: ${note}`;
    const existingNotes = incident?.adminNotes || '';
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { adminNotes: updatedNotes },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.incident.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Incident[]> {
    const incidents = await this.prisma.incident.findMany({
      include: this.getIncludeOptions(),
      orderBy: { reportedAt: 'desc' },
    });

    return incidents.map(incident => this.mapToDomainEntity(incident));
  }

  async count(): Promise<number> {
    return this.prisma.incident.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.incident.count({
      where: { riderId },
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.incident.count({
      where: { status: status as any },
    });
  }

  async countBySeverity(severity: string): Promise<number> {
    return this.prisma.incident.count({
      where: { severity: severity as any },
    });
  }

  async getAverageResolutionTime(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.IncidentWhereInput = {
      status: 'RESOLVED',
      resolvedAt: {
        not: null,
      },
    };

    if (startDate) {
      where.reportedAt = { gte: startDate };
    }

    if (endDate) {
      where.reportedAt = {
        ...where.reportedAt,
        lte: endDate,
      };
    }

    const query = `
      SELECT AVG(TIMESTAMPDIFF(MINUTE, reported_at, resolved_at)) as avgResolutionTime
      FROM incidents
      WHERE status = 'RESOLVED'
        AND resolved_at IS NOT NULL
        ${startDate ? 'AND reported_at >= ?' : ''}
        ${endDate ? 'AND reported_at <= ?' : ''}
    `;

    const params = [];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    const result = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
    return Number(result[0]?.avgResolutionTime) || 0;
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
      order: {
        select: {
          id: true,
          trackingId: true,
          status: true,
          totalAmount: true,
        },
      },
      shift: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    };
  }

  private mapToIncidentData(incident: Incident): Prisma.IncidentCreateInput | Prisma.IncidentUpdateInput {
    const location = incident.getLocation();

    return {
      riderId: incident.getRiderId(),
      orderId: incident.getOrderId(),
      shiftId: incident.getShiftId(),
      type: incident.getType() as any,
      severity: incident.getSeverity() as any,
      status: incident.getStatus() as any,
      title: incident.getTitle(),
      description: incident.getDescription(),
      latitude: location?.getLatitude(),
      longitude: location?.getLongitude(),
      address: incident.getAddress(),
      city: incident.getCity(),
      reportedBy: incident.getReportedBy(),
      assignedTo: incident.getAssignedTo(),
      reportedAt: incident.getReportedAt(),
      resolvedAt: incident.getResolvedAt(),
      riderNotes: incident.getRiderNotes(),
      adminNotes: incident.getAdminNotes(),
      attachments: incident.getAttachments() ? JSON.stringify(incident.getAttachments()) : null,
      metadata: incident.getMetadata() ? JSON.stringify(incident.getMetadata()) : null,
    };
  }

  private mapToDomainEntity(data: any): Incident {
    const location = (data.latitude && data.longitude) ?
      Location.create(data.latitude, data.longitude) : null;

    return new Incident(
      data.id,
      data.riderId,
      data.orderId,
      data.shiftId,
      data.type,
      data.severity,
      data.status,
      data.title,
      data.description,
      location,
      data.address,
      data.city,
      data.reportedBy,
      data.assignedTo,
      data.reportedAt,
      data.resolvedAt,
      data.riderNotes,
      data.adminNotes,
      data.attachments ? JSON.parse(data.attachments) : null,
      data.metadata ? JSON.parse(data.metadata) : null,
      data.createdAt,
      data.updatedAt,
    );
  }
}