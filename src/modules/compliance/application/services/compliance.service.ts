import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { CreateComplianceAppealDto } from '../dtos/compliance.dto';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getTaskerSummary(userId: string, activeRole?: string) {
    this.assertTaskerAccess(activeRole);

    const complianceCaseModel = (this.prisma as any).complianceCase;
    const cases = await complianceCaseModel.findMany({
      where: {
        userId,
        role: { in: ['tasker', 'driver'] },
      },
    });

    const strikeCount = cases.reduce(
      (total: number, item: any) => total + Number(item.strikeCount || 0),
      0,
    );
    const warningCount = cases.filter(
      (item: any) => String(item.severity || '').toLowerCase() === 'warning',
    ).length;
    const activeCaseCount = cases.filter((item: any) =>
      ['open', 'under_review', 'appealed'].includes(
        String(item.status || '').toLowerCase(),
      ),
    ).length;
    const suspensionStatus = cases.some(
      (item: any) =>
        String(item.suspensionState || '').toLowerCase() === 'suspended',
    )
      ? 'suspended'
      : 'clear';

    return {
      summary: {
        warningCount,
        strikeCount,
        activeCaseCount,
        suspensionStatus,
      },
    };
  }

  async listTaskerCases(userId: string, activeRole?: string) {
    this.assertTaskerAccess(activeRole);

    const complianceCaseModel = (this.prisma as any).complianceCase;
    const cases = await complianceCaseModel.findMany({
      where: {
        userId,
        role: { in: ['tasker', 'driver'] },
      },
      include: {
        appeals: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      cases: cases.map((item: any) => this.toCaseDto(item)),
    };
  }

  async createTaskerAppeal(
    userId: string,
    caseId: string,
    input: CreateComplianceAppealDto,
    activeRole?: string,
  ) {
    this.assertTaskerAccess(activeRole);

    const complianceCaseModel = (this.prisma as any).complianceCase;
    const complianceAppealModel = (this.prisma as any).complianceAppeal;

    const record = await complianceCaseModel.findFirst({
      where: {
        id: caseId,
        userId,
        role: { in: ['tasker', 'driver'] },
      },
      include: {
        appeals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Compliance case not found');
    }

    const latestAppeal = Array.isArray(record.appeals) ? record.appeals[0] : null;
    if (
      latestAppeal &&
      ['submitted', 'under_review'].includes(
        String(latestAppeal.status || '').toLowerCase(),
      )
    ) {
      throw new BadRequestException('An appeal is already under review');
    }

    const appeal = await complianceAppealModel.create({
      data: {
        caseId: record.id,
        userId,
        message: input.message.trim(),
        status: 'submitted',
        metadata: input.metadata as any,
      },
    });

    await complianceCaseModel.update({
      where: { id: record.id },
      data: {
        status: 'appealed',
        updatedAt: new Date(),
      },
    });

    await this.notificationsService.createNotification({
      userId,
      title: 'Appeal submitted',
      message: `Your appeal for compliance case ${record.title} has been submitted for review.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'compliance_case',
        entityId: record.id,
        notificationType: 'compliance_appeal',
      },
    });

    return {
      appeal: {
        id: appeal.id,
        caseId: appeal.caseId,
        status: appeal.status,
        message: appeal.message,
        createdAt: appeal.createdAt.toISOString(),
        reviewedAt: appeal.reviewedAt?.toISOString() || null,
        reviewNotes: appeal.reviewNotes || null,
      },
    };
  }

  private assertTaskerAccess(activeRole?: string) {
    const normalized = String(activeRole || '').toLowerCase();
    if (!['tasker', 'driver'].includes(normalized)) {
      throw new ForbiddenException('Tasker role required');
    }
  }

  private toCaseDto(item: any) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      severity: item.severity,
      status: item.status,
      strikeCount: Number(item.strikeCount || 0),
      suspensionState: item.suspensionState || 'clear',
      occurredAt: item.occurredAt.toISOString(),
      reviewedAt: item.reviewedAt?.toISOString() || null,
      resolutionNotes: item.resolutionNotes || null,
      appeals: Array.isArray(item.appeals)
        ? item.appeals.map((appeal: any) => ({
            id: appeal.id,
            caseId: appeal.caseId,
            status: appeal.status,
            message: appeal.message,
            createdAt: appeal.createdAt.toISOString(),
            reviewedAt: appeal.reviewedAt?.toISOString() || null,
            reviewNotes: appeal.reviewNotes || null,
          }))
        : [],
    };
  }
}
