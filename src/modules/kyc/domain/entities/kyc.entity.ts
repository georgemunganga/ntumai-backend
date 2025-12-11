import { KycStatus } from '@prisma/client';

export class KycEntity {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: KycStatus;

  constructor(data: Partial<KycEntity>) {
    Object.assign(this, data);
  }
}
