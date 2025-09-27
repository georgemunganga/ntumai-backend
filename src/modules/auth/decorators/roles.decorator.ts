import { SetMetadata } from '@nestjs/common';
import { UserRole, UserRoleEnum } from '../domain/value-objects/user-role.value-object';

type RoleInput = UserRole | UserRoleEnum | keyof typeof UserRoleEnum | string;

type NormalizedRole = string;

const normalizeRole = (role: RoleInput): NormalizedRole => {
  if (role instanceof UserRole) {
    return role.value;
  }

  if (typeof role === 'string') {
    return role.toUpperCase();
  }

  return role;
};

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleInput[]) =>
  SetMetadata(
    ROLES_KEY,
    roles.map((role) => normalizeRole(role)),
  );
