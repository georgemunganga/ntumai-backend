import { Vendor as PrismaVendor } from '@prisma/client';

export class VendorEntity {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  kycStatus: string;
  isOpen: boolean;

  constructor(data: Partial<VendorEntity>) {
    Object.assign(this, data);
  }
}
