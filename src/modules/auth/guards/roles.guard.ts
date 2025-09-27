import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../domain/value-objects/user-role.value-object';

const normalizeRole = (value: unknown): string | null => {
  if (value instanceof UserRole) {
    return value.value;
  }

  if (typeof value === 'string') {
    return value.toUpperCase();
  }

  return null;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const normalizedUserRole =
      normalizeRole(user.currentRole) ??
      normalizeRole(user.role) ??
      normalizeRole(user['current_role']);

    if (!normalizedUserRole) {
      return false;
    }

    return requiredRoles.some((role) => normalizedUserRole === role);
  }
}
