import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VendorService } from '../../application/services/vendor.service';
import { CreateVendorDto, UpdateVendorDto } from '../dtos/vendor.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';

@Controller('api/v1/vendors')
@UseGuards(JwtAuthGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.vendorService.findById(id);
  }

  @Post()
  async create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.create(createVendorDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorService.update(id, updateVendorDto);
  }
}
