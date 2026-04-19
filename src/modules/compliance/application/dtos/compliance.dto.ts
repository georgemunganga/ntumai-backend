import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ComplianceAppealDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  caseId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ required: false, nullable: true })
  reviewedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  reviewNotes!: string | null;
}

export class ComplianceCaseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  severity!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  strikeCount!: number;

  @ApiProperty()
  suspensionState!: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiProperty({ required: false, nullable: true })
  reviewedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  resolutionNotes!: string | null;

  @ApiProperty({ type: [ComplianceAppealDto] })
  appeals!: ComplianceAppealDto[];
}

export class ComplianceSummaryDto {
  @ApiProperty()
  warningCount!: number;

  @ApiProperty()
  strikeCount!: number;

  @ApiProperty()
  activeCaseCount!: number;

  @ApiProperty()
  suspensionStatus!: string;
}

export class ComplianceSummaryResponseDto {
  @ApiProperty({ type: ComplianceSummaryDto })
  summary!: ComplianceSummaryDto;
}

export class ComplianceCaseListResponseDto {
  @ApiProperty({ type: [ComplianceCaseDto] })
  cases!: ComplianceCaseDto[];
}

export class ComplianceAppealResponseDto {
  @ApiProperty({ type: ComplianceAppealDto })
  appeal!: ComplianceAppealDto;
}

export class CreateComplianceAppealDto {
  @ApiProperty({
    example: 'I would like this case reviewed because the delivery address was inaccessible.',
  })
  @IsString()
  @MaxLength(1000)
  message!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
