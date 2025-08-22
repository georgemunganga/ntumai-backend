import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../domain/value-objects/user-role.value-object';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }
    
    // Handle both UserRole value object and string comparison
    const userRole = user.role instanceof UserRole ? user.role.value : user.role;
    
    return requiredRoles.some((role) => {
      const roleValue = role instanceof UserRole ? role.value : role;
      return userRole === roleValue;
    });
  }
}