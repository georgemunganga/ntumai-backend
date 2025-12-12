export class UserEntity {
  id: string;
  phoneNumber?: string;
  email?: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<UserEntity>) {
    this.id = data.id || this.generateId();
    this.phoneNumber = data.phoneNumber;
    this.email = data.email;
    this.status = data.status || 'PENDING_VERIFICATION';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  activate(): void {
    this.status = 'ACTIVE';
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = 'DEACTIVATED';
    this.updatedAt = new Date();
  }
}
