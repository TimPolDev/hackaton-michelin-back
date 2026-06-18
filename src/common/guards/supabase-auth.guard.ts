import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import ws from 'ws';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as typeof WebSocket },
      },
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify JWT with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        console.error('[SupabaseAuthGuard] getUser failed:', {
          message: error?.message,
          status: (error as { status?: number })?.status,
          name: error?.name,
        });
        throw new UnauthorizedException('Invalid token');
      }

      // Fetch or create cyclist from database
      let cyclist = await this.prisma.cyclist.findUnique({
        where: { supabaseUserId: user.id },
        select: { isAdmin: true },
      });

      // Auto-create cyclist if doesn't exist (fallback if trigger didn't work)
      if (!cyclist) {
        // A cyclist may already exist with this email but a different
        // supabaseUserId (e.g. the Supabase auth user was recreated).
        // In that case, re-link the existing row to the current user id
        // instead of failing on the unique email constraint.
        const existingByEmail = await this.prisma.cyclist.findUnique({
          where: { email: user.email! },
          select: { id: true, isAdmin: true },
        });

        if (existingByEmail) {
          cyclist = await this.prisma.cyclist.update({
            where: { id: existingByEmail.id },
            data: { supabaseUserId: user.id },
            select: { isAdmin: true },
          });
        } else {
          cyclist = await this.prisma.cyclist.create({
            data: {
              supabaseUserId: user.id,
              email: user.email!,
              fullName: user.user_metadata?.full_name || user.email,
              isAdmin: false,
              isAmbassador: false,
            },
            select: { isAdmin: true },
          });
        }
      }

      // Attach user to request
      request.user = {
        supabaseUserId: user.id,
        email: user.email,
        isAdmin: cyclist.isAdmin,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[SupabaseAuthGuard] validation error:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
