import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto, PriorityEnum } from './create-errand.dto';
import { ErrandStatusEnum } from './update-errand.dto';
import { ProofTypeEnum } from './add-proof.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatar?: string;
}

export class ProofResponseDto {
  @ApiProperty({ description: 'Proof ID' })
  id: string;

  @ApiProperty({ description: 'Type of proof', enum: ProofTypeEnum })
  type: ProofTypeEnum;

  @ApiProperty({ description: 'URL to the proof file' })
  url: string;

  @ApiPropertyOptional({ description: 'Description of the proof' })
  description?: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ description: 'Uploader information', type: UserResponseDto })
  uploader: UserResponseDto;
}

export class ErrandResponseDto {
  @ApiProperty({ description: 'Errand ID' })
  id: string;

  @ApiProperty({ description: 'Title of the errand' })
  title: string;

  @ApiProperty({ description: 'Description of the errand' })
  description: string;

  @ApiProperty({ description: 'Category of the errand' })
  category: string;

  @ApiProperty({ description: 'Requirements for the errand', type: [String] })
  requirements: string[];

  @ApiProperty({ description: 'Pickup location', type: LocationDto })
  pickupLocation: LocationDto;

  @ApiProperty({ description: 'Dropoff location', type: LocationDto })
  dropoffLocation: LocationDto;

  @ApiPropertyOptional({ description: 'Start location', type: LocationDto })
  startLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Completion location', type: LocationDto })
  completionLocation?: LocationDto;

  @ApiProperty({ description: 'Price in cents' })
  price: number;

  @ApiProperty({ description: 'Priority level', enum: PriorityEnum })
  priority: PriorityEnum;

  @ApiPropertyOptional({ description: 'Deadline for completion' })
  deadline?: Date;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  estimatedDuration?: number;

  @ApiProperty({ description: 'Current status', enum: ErrandStatusEnum })
  status: ErrandStatusEnum;

  @ApiPropertyOptional({ description: 'Assigned driver ID' })
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Assigned driver information', type: UserResponseDto })
  assignedDriver?: UserResponseDto;

  @ApiPropertyOptional({ description: 'Start timestamp' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Cancellation timestamp' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Cancelled by user ID' })
  cancelledBy?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  cancellationReason?: string;

  @ApiPropertyOptional({ description: 'Completion notes' })
  completionNotes?: string;

  @ApiProperty({ description: 'Refund requested flag' })
  refundRequested: boolean;

  @ApiProperty({ description: 'Proofs attached to the errand', type: [ProofResponseDto] })
  proofs: ProofResponseDto[];

  @ApiProperty({ description: 'Creator user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creator information', type: UserResponseDto })
  creator: UserResponseDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ErrandTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Template description' })
  description: string;

  @ApiProperty({ description: 'Template category' })
  category: string;

  @ApiProperty({ description: 'Template tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Default requirements', type: [String] })
  requirements: string[];

  @ApiPropertyOptional({ description: 'Default pickup location', type: LocationDto })
  defaultPickupLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Default dropoff location', type: LocationDto })
  defaultDropoffLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Default price in cents' })
  defaultPrice?: number;

  @ApiProperty({ description: 'Default priority', enum: PriorityEnum })
  defaultPriority: PriorityEnum;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  estimatedDuration?: number;

  @ApiProperty({ description: 'Public visibility flag' })
  isPublic: boolean;

  @ApiProperty({ description: 'Active status flag' })
  isActive: boolean;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiPropertyOptional({ description: 'Last used timestamp' })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creator user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creator information', type: UserResponseDto })
  creator: UserResponseDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ErrandHistoryResponseDto {
  @ApiProperty({ description: 'History entry ID' })
  id: string;

  @ApiProperty({ description: 'Related errand ID' })
  errandId: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Action description' })
  description: string;

  @ApiProperty({ description: 'User who performed the action' })
  performedBy: string;

  @ApiProperty({ description: 'Performer information', type: UserResponseDto })
  performer: UserResponseDto;

  @ApiProperty({ description: 'Action timestamp' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Location where action was performed', type: LocationDto })
  location?: LocationDto;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Critical action flag' })
  isCritical: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  items: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page flag' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page flag' })
  hasPrev: boolean;
}

export class ErrandStatisticsResponseDto {
  @ApiProperty({ description: 'Total number of errands' })
  total: number;

  @ApiProperty({ description: 'Count by status' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'Count by priority' })
  byPriority: Record<string, number>;

  @ApiProperty({ description: 'Count by category' })
  byCategory: Record<string, number>;
}

export class TemplateStatisticsResponseDto {
  @ApiProperty({ description: 'Total number of templates' })
  total: number;

  @ApiProperty({ description: 'Number of active templates' })
  active: number;

  @ApiProperty({ description: 'Number of public templates' })
  public: number;

  @ApiProperty({ description: 'Count by category' })
  byCategory: Record<string, number>;

  @ApiProperty({ description: 'Total usage count' })
  totalUsage: number;
}