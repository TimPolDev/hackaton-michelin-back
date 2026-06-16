import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  supabaseUserId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
