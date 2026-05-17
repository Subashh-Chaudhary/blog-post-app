import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OptionalGqlAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    if (!req.headers.authorization) {
      return true; // Proceed without attaching user
    }

    const [type, token] = req.headers.authorization.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return true; // Ignore invalid format and proceed as guest
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      // Attach the payload securely
      req.user = { _id: payload.sub, email: payload.email };
    } catch {
      // Ignore token verification failure, proceed as unauthenticated
    }

    return true; // Always return true to allow access
  }
}
