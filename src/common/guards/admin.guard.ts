import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ADMIN_KEY } from '../decorators/require-admin.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route requires admin
    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isAdmin) {
      throw new ForbiddenException(
        'Access denied: Admin privileges required',
      );
    }

    return true;
  }
}
