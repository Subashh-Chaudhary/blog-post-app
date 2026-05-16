import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    if (!req.headers.authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, token] = req.headers.authorization.split(' ');
    
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      // Attach the payload (which contains `sub` as userId and `email`) to the request
      // We map `sub` to `_id` so the @CurrentUser decorator gets a clean user object.
      req.user = { _id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
