import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';

// Controllers
import {
  ErrandsController,
  ErrandTemplatesController,
} from './presentation/controllers';

// Application Services
import {
  ErrandManagementService,
  ErrandTemplateService,
} from './application/services';

// Domain Services
import {
  ErrandDomainService,
  ErrandAssignmentService,
  ErrandLifecycleService,
} from './domain/services';

// Repository Implementations
import {
  ErrandRepositoryImpl,
  ErrandTemplateRepositoryImpl,
  ErrandHistoryRepositoryImpl,
} from './infrastructure/repositories';

// Repository Interfaces (for DI)
import { ErrandRepository } from './domain/repositories/errand.repository';
import { ErrandTemplateRepository } from './domain/repositories/errand-template.repository';
import { ErrandHistoryRepository } from './domain/repositories/errand-history.repository';

@Module({
  imports: [
    PrismaModule, // For database access
  ],
  controllers: [
    ErrandsController,
    ErrandTemplatesController,
  ],
  providers: [
    // Application Services
    ErrandManagementService,
    ErrandTemplateService,

    // Domain Services
    ErrandDomainService,
    ErrandAssignmentService,
    ErrandLifecycleService,

    // Repository Implementations
    {
      provide: ErrandRepository,
      useClass: ErrandRepositoryImpl,
    },
    {
      provide: ErrandTemplateRepository,
      useClass: ErrandTemplateRepositoryImpl,
    },
    {
      provide: ErrandHistoryRepository,
      useClass: ErrandHistoryRepositoryImpl,
    },
  ],
  exports: [
    // Export services that might be used by other modules
    ErrandManagementService,
    ErrandTemplateService,
    ErrandDomainService,
    ErrandAssignmentService,
    ErrandLifecycleService,

    // Export repositories for potential use in other modules
    ErrandRepository,
    ErrandTemplateRepository,
    ErrandHistoryRepository,
  ],
})
export class ErrandsModule {}