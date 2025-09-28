import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ErrandEntity } from '../../domain/entities/errand.entity';
import { ErrandHistoryEntity } from '../../domain/entities/errand-history.entity';
import { ErrandRepository } from '../../domain/repositories/errand.repository';
import { ErrandHistoryRepository } from '../../domain/repositories/errand-history.repository';
import { ErrandLifecycleService } from '../../domain/services/errand-lifecycle.service';
import { ErrandAssignmentService } from '../../domain/services/errand-assignment.service';
import { LocationVO } from '../../domain/value-objects/location.vo';
import { PriorityVO } from '../../domain/value-objects/priority.vo';
import { ErrandStatusVO } from '../../domain/value-objects/errand-status.vo';
import { ProofVO } from '../../domain/value-objects/proof-type.vo';

export interface CreateErrandRequest {
  title: string;
  description?: string;
  category: string;
  requirements?: string[];
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  price: number;
  priority: string;
  deadline?: Date;
  estimatedDuration?: number;
  createdBy: string;
}

export interface UpdateErrandRequest {
  title?: string;
  description?: string;
  requirements?: string[];
  price?: number;
  priority?: string;
  deadline?: Date;
  estimatedDuration?: number;
}

export interface AssignErrandRequest {
  driverId: string;
  assignedBy: string;
}

export interface StartErrandRequest {
  startedBy: string;
  startLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
}

export interface CompleteErrandRequest {
  completedBy: string;
  completionNotes?: string;
  completionLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  proofs?: {
    type: string;
    url: string;
    description?: string;
  }[];
}

export interface CancelErrandRequest {
  cancelledBy: string;
  reason: string;
  refundRequested?: boolean;
}

export interface ErrandFiltersRequest {
  status?: string[];
  priority?: string[];
  category?: string[];
  createdBy?: string;
  assignedTo?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface ErrandSortRequest {
  field: 'createdAt' | 'deadline' | 'price' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

export interface PaginationRequest {
  page: number;
  limit: number;
}

@Injectable()
export class ErrandManagementService {
  constructor(
    private readonly errandRepository: ErrandRepository,
    private readonly errandHistoryRepository: ErrandHistoryRepository,
    private readonly errandLifecycleService: ErrandLifecycleService,
    private readonly errandAssignmentService: ErrandAssignmentService,
  ) {}

  async createErrand(request: CreateErrandRequest): Promise<ErrandEntity> {
    // Create value objects
    const pickupLocation = new LocationVO(
      request.pickupLocation.address,
      request.pickupLocation.latitude,
      request.pickupLocation.longitude,
      request.pickupLocation.instructions,
    );

    const dropoffLocation = new LocationVO(
      request.dropoffLocation.address,
      request.dropoffLocation.latitude,
      request.dropoffLocation.longitude,
      request.dropoffLocation.instructions,
    );

    const priority = new PriorityVO(request.priority);

    // Create errand entity
    const errand = ErrandEntity.create({
      title: request.title,
      description: request.description,
      category: request.category,
      requirements: request.requirements || [],
      pickupLocation,
      dropoffLocation,
      price: request.price,
      priority,
      deadline: request.deadline,
      estimatedDuration: request.estimatedDuration,
      createdBy: request.createdBy,
    });

    // Save errand
    const savedErrand = await this.errandRepository.save(errand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createCreated(
      savedErrand.getId(),
      request.createdBy,
      { title: request.title, category: request.category },
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async getErrandById(id: string, userId: string): Promise<ErrandEntity> {
    const errand = await this.errandRepository.findById(id);
    if (!errand) {
      throw new NotFoundException('Errand not found');
    }

    // Check user access
    if (!errand.hasUserAccess(userId)) {
      throw new ForbiddenException('Access denied to this errand');
    }

    return errand;
  }

  async getErrands(
    filters: ErrandFiltersRequest,
    sort: ErrandSortRequest,
    pagination: PaginationRequest,
    userId: string,
  ): Promise<{ errands: ErrandEntity[]; total: number; page: number; limit: number }> {
    const result = await this.errandRepository.findMany({
      filters: {
        status: filters.status,
        priority: filters.priority,
        category: filters.category,
        createdBy: filters.createdBy,
        assignedTo: filters.assignedTo,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        startDate: filters.startDate,
        endDate: filters.endDate,
        location: filters.location,
        userId, // For access control
      },
      sort: {
        field: sort.field,
        direction: sort.direction,
      },
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
      },
    });

    return {
      errands: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async updateErrand(
    id: string,
    request: UpdateErrandRequest,
    userId: string,
  ): Promise<ErrandEntity> {
    const errand = await this.getErrandById(id, userId);

    // Check if errand can be updated
    if (!errand.canBeUpdated()) {
      throw new BadRequestException('Errand cannot be updated in its current status');
    }

    // Check if user can update (only creator can update)
    if (errand.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the errand creator can update the errand');
    }

    // Create priority VO if provided
    const priority = request.priority ? new PriorityVO(request.priority) : undefined;

    // Update errand
    const updatedErrand = errand.updateDetails({
      title: request.title,
      description: request.description,
      requirements: request.requirements,
      price: request.price,
      priority,
      deadline: request.deadline,
      estimatedDuration: request.estimatedDuration,
    });

    // Save updated errand
    const savedErrand = await this.errandRepository.save(updatedErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createUpdated(
      id,
      userId,
      request,
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async assignErrand(
    id: string,
    request: AssignErrandRequest,
  ): Promise<ErrandEntity> {
    const errand = await this.errandRepository.findById(id);
    if (!errand) {
      throw new NotFoundException('Errand not found');
    }

    // Validate assignment using domain service
    const isValidAssignment = await this.errandAssignmentService.validateAssignment(
      errand,
      request.driverId,
    );

    if (!isValidAssignment) {
      throw new BadRequestException('Driver cannot be assigned to this errand');
    }

    // Use lifecycle service to assign
    const assignedErrand = await this.errandLifecycleService.assignErrand(
      errand,
      request.driverId,
      request.assignedBy,
    );

    // Save assigned errand
    const savedErrand = await this.errandRepository.save(assignedErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createAssigned(
      id,
      request.assignedBy,
      request.driverId,
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async startErrand(
    id: string,
    request: StartErrandRequest,
  ): Promise<ErrandEntity> {
    const errand = await this.getErrandById(id, request.startedBy);

    // Create start location VO if provided
    const startLocation = request.startLocation
      ? new LocationVO(
          request.startLocation.address,
          request.startLocation.latitude,
          request.startLocation.longitude,
          request.startLocation.instructions,
        )
      : undefined;

    // Use lifecycle service to start
    const startedErrand = await this.errandLifecycleService.startErrand(
      errand,
      request.startedBy,
      startLocation,
    );

    // Save started errand
    const savedErrand = await this.errandRepository.save(startedErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createStarted(
      id,
      request.startedBy,
      startLocation?.toJSON(),
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async completeErrand(
    id: string,
    request: CompleteErrandRequest,
  ): Promise<ErrandEntity> {
    const errand = await this.getErrandById(id, request.completedBy);

    // Create completion location VO if provided
    const completionLocation = request.completionLocation
      ? new LocationVO(
          request.completionLocation.address,
          request.completionLocation.latitude,
          request.completionLocation.longitude,
          request.completionLocation.instructions,
        )
      : undefined;

    // Create proof VOs if provided
    const proofs = request.proofs?.map(
      (proof) => new ProofVO(proof.type, proof.url, proof.description),
    ) || [];

    // Use lifecycle service to complete
    const completedErrand = await this.errandLifecycleService.completeErrand(
      errand,
      request.completedBy,
      request.completionNotes,
      completionLocation,
      proofs,
    );

    // Save completed errand
    const savedErrand = await this.errandRepository.save(completedErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createCompleted(
      id,
      request.completedBy,
      {
        notes: request.completionNotes,
        location: completionLocation?.toJSON(),
        proofsCount: proofs.length,
      },
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async cancelErrand(
    id: string,
    request: CancelErrandRequest,
  ): Promise<ErrandEntity> {
    const errand = await this.getErrandById(id, request.cancelledBy);

    // Use lifecycle service to cancel
    const cancelledErrand = await this.errandLifecycleService.cancelErrand(
      errand,
      request.cancelledBy,
      request.reason,
      request.refundRequested,
    );

    // Save cancelled errand
    const savedErrand = await this.errandRepository.save(cancelledErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createCancelled(
      id,
      request.cancelledBy,
      {
        reason: request.reason,
        refundRequested: request.refundRequested,
      },
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async getErrandHistory(
    id: string,
    userId: string,
  ): Promise<ErrandHistoryEntity[]> {
    // Check if user has access to the errand
    const errand = await this.getErrandById(id, userId);

    return this.errandHistoryRepository.findByErrandId(id);
  }

  async addProofToErrand(
    id: string,
    proof: { type: string; url: string; description?: string },
    userId: string,
  ): Promise<ErrandEntity> {
    const errand = await this.getErrandById(id, userId);

    // Check if user can add proof (assigned driver or creator)
    if (errand.getAssignedTo() !== userId && errand.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only assigned driver or creator can add proof');
    }

    const proofVO = new ProofVO(proof.type, proof.url, proof.description);
    const updatedErrand = errand.addProof(proofVO);

    // Save updated errand
    const savedErrand = await this.errandRepository.save(updatedErrand);

    // Create history entry
    const historyEntry = ErrandHistoryEntity.createProofAdded(
      id,
      userId,
      { type: proof.type, description: proof.description },
    );
    await this.errandHistoryRepository.save(historyEntry);

    return savedErrand;
  }

  async getAvailableErrands(
    location?: { latitude: number; longitude: number; radius: number },
    pagination?: PaginationRequest,
  ): Promise<{ errands: ErrandEntity[]; total: number }> {
    const result = await this.errandRepository.findAvailable(location, pagination);
    return {
      errands: result.items,
      total: result.total,
    };
  }

  async getErrandsByUser(
    userId: string,
    type: 'created' | 'assigned',
    pagination?: PaginationRequest,
  ): Promise<{ errands: ErrandEntity[]; total: number }> {
    const result = type === 'created'
      ? await this.errandRepository.findByCreatedBy(userId, pagination)
      : await this.errandRepository.findByAssignedTo(userId, pagination);

    return {
      errands: result.items,
      total: result.total,
    };
  }

  async getErrandStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    return this.errandRepository.getStatistics(userId);
  }
}