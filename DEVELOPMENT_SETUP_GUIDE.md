# Development Setup Guide

## 🚀 Quick Start Checklist

### ✅ **Pre-Development Setup (30 minutes)**

#### 1. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# See IMPLEMENTATION_PLAN.md for complete environment variables list
```

#### 2. Database Setup
```bash
# Install PostgreSQL (if not already installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Create database
psql -U postgres -c "CREATE DATABASE ntumai_db;"

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed
```

#### 3. Development Server
```bash
# Start development server
npm run start:dev

# Verify server is running
# Visit: http://localhost:3000/api/docs (Swagger UI)
```

### 📋 **Development Workflow**

#### Branch Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches
feature/onboarding-module
feature/kyc-module  
feature/inventory-management
feature/geolocation-module
feature/audit-logs

# Create feature branch
git checkout -b feature/onboarding-module
```

#### Commit Convention
```bash
# Format: type(scope): description
feat(onboarding): add user progress tracking
fix(kyc): resolve document upload validation
docs(api): update swagger documentation
test(inventory): add unit tests for stock alerts
refactor(auth): improve JWT token validation
```

## 🛠️ **Module Development Template**

### Step 1: Generate Module Structure
```bash
# Generate new module
nest g module modules/onboarding
nest g service modules/onboarding
nest g controller modules/onboarding

# Create additional directories
mkdir src/modules/onboarding/dto
mkdir src/modules/onboarding/entities
mkdir src/modules/onboarding/interfaces
```

### Step 2: Database Models
```bash
# Add models to schema.prisma
# Run migration
npx prisma db push
npx prisma generate
```

### Step 3: Create DTOs
```typescript
// src/modules/onboarding/dto/create-onboarding-flow.dto.ts
import { IsString, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateOnboardingFlowDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  description?: string;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ type: [Object] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingStepDto)
  steps: OnboardingStepDto[];
}
```

### Step 4: Implement Service
```typescript
// src/modules/onboarding/onboarding.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateOnboardingFlowDto } from './dto/create-onboarding-flow.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async createFlow(createFlowDto: CreateOnboardingFlowDto) {
    return this.prisma.onboardingFlow.create({
      data: {
        ...createFlowDto,
        steps: {
          create: createFlowDto.steps
        }
      },
      include: {
        steps: true
      }
    });
  }

  async getFlowByRole(role: UserRole) {
    const flow = await this.prisma.onboardingFlow.findFirst({
      where: { role, isActive: true },
      include: { steps: { orderBy: { order: 'asc' } } }
    });
    
    if (!flow) {
      throw new NotFoundException(`No active onboarding flow found for role: ${role}`);
    }
    
    return flow;
  }

  async getUserProgress(userId: string) {
    return this.prisma.userOnboardingProgress.findMany({
      where: { userId },
      include: {
        step: {
          include: {
            flow: true
          }
        }
      }
    });
  }
}
```

### Step 5: Create Controller
```typescript
// src/modules/onboarding/onboarding.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingFlowDto } from './dto/create-onboarding-flow.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({ summary: 'Get onboarding flow for specific role' })
  @ApiResponse({ status: 200, description: 'Onboarding flow retrieved successfully' })
  @Get('flow/:role')
  async getFlowByRole(@Param('role') role: UserRole) {
    return this.onboardingService.getFlowByRole(role);
  }

  @ApiOperation({ summary: 'Get user onboarding progress' })
  @ApiResponse({ status: 200, description: 'User progress retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async getUserProgress(@Req() req) {
    return this.onboardingService.getUserProgress(req.user.id);
  }

  @ApiOperation({ summary: 'Create new onboarding flow' })
  @ApiResponse({ status: 201, description: 'Onboarding flow created successfully' })
  @Post('flow')
  async createFlow(@Body() createFlowDto: CreateOnboardingFlowDto) {
    return this.onboardingService.createFlow(createFlowDto);
  }
}
```

### Step 6: Add Tests
```typescript
// src/modules/onboarding/onboarding.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '@/database/prisma.service';
import { UserRole } from '@prisma/client';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: {
            onboardingFlow: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            userOnboardingProgress: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFlowByRole', () => {
    it('should return onboarding flow for valid role', async () => {
      const mockFlow = {
        id: '1',
        role: UserRole.CUSTOMER,
        name: 'Customer Onboarding',
        isActive: true,
        steps: []
      };

      jest.spyOn(prisma.onboardingFlow, 'findFirst').mockResolvedValue(mockFlow);

      const result = await service.getFlowByRole(UserRole.CUSTOMER);
      expect(result).toEqual(mockFlow);
    });

    it('should throw NotFoundException for invalid role', async () => {
      jest.spyOn(prisma.onboardingFlow, 'findFirst').mockResolvedValue(null);

      await expect(service.getFlowByRole(UserRole.CUSTOMER))
        .rejects.toThrow('No active onboarding flow found for role: CUSTOMER');
    });
  });
});
```

## 🧪 **Testing Strategy**

### Unit Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- onboarding.service.spec.ts
```

### Integration Tests
```bash
# Run e2e tests
npm run test:e2e

# Create e2e test file
# test/onboarding.e2e-spec.ts
```

### API Testing with Thunder Client/Postman
```json
{
  "name": "Get Onboarding Flow",
  "request": {
    "method": "GET",
    "url": "{{baseUrl}}/api/v1/onboarding/flow/CUSTOMER",
    "headers": {
      "Authorization": "Bearer {{authToken}}"
    }
  }
}
```

## 📊 **Development Tools**

### Database Management
```bash
# Prisma Studio (Database GUI)
npx prisma studio
# Opens at: http://localhost:5555

# View database schema
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset
```

### API Documentation
```bash
# Swagger UI available at:
# http://localhost:3000/api/docs

# Generate OpenAPI spec
curl http://localhost:3000/api/docs-json > api-spec.json
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run build
```

## 🔧 **Debugging Setup**

### VS Code Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "args": [],
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Logging Configuration
```typescript
// src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${new Date().toISOString()}] [LOG] [${context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${context}] ${message}`);
    if (trace) console.error(trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${context}] ${message}`);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${context}] ${message}`);
    }
  }
}
```

## 🚀 **Deployment Preparation**

### Environment-Specific Configurations
```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Docker build (if using containers)
docker build -t ntumai-backend .
docker run -p 3000:3000 ntumai-backend
```

## 📋 **Daily Development Checklist**

### Before Starting Work
- [ ] Pull latest changes from develop branch
- [ ] Check if database schema is up to date
- [ ] Run tests to ensure nothing is broken
- [ ] Review assigned tasks/issues

### During Development
- [ ] Write tests for new functionality
- [ ] Update API documentation
- [ ] Follow coding standards and conventions
- [ ] Commit changes frequently with clear messages

### Before Pushing Code
- [ ] Run all tests and ensure they pass
- [ ] Check code coverage meets requirements (>80%)
- [ ] Lint and format code
- [ ] Update documentation if needed
- [ ] Create/update pull request

## 🆘 **Troubleshooting Guide**

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Reset Prisma client
npx prisma generate
```

#### Module Import Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript paths in tsconfig.json
# Restart TypeScript server in VS Code: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

#### Test Failures
```bash
# Clear Jest cache
npm run test -- --clearCache

# Run tests in verbose mode
npm run test -- --verbose

# Debug specific test
npm run test -- --testNamePattern="should return onboarding flow"
```

---

**🎯 Ready to Start Development!**

With this setup guide, you have everything needed to begin implementing the new modules. Follow the step-by-step process for each module, and refer to the IMPLEMENTATION_PLAN.md for detailed technical specifications.

**Next Steps:**
1. Set up your development environment using this guide
2. Start with the Onboarding Module (highest priority)
3. Follow the module development template
4. Test thoroughly and document your progress