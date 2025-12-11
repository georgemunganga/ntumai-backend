import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { KycService } from '../../application/services/kyc.service';
import { CreateKycDto, UpdateKycDto } from '../dtos/kyc.dto';

@Controller('api/v1/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.kycService.findByUserId(userId);
  }

  @Post()
  async create(@Body() createKycDto: CreateKycDto) {
    return this.kycService.create(createKycDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateKycDto: UpdateKycDto) {
    return this.kycService.update(id, updateKycDto);
  }
}
