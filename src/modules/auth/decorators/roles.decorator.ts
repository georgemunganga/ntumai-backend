import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../domain/value-objects/user-role.value-object';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);