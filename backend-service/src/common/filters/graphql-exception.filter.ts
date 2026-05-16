import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch(HttpException)
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: any) {
    if (host.getType() === 'graphql') {
      const response = exception.getResponse();
      const status = exception.getStatus();

      // Return a standard Apollo Error format for client consistency
      return new Error(
        JSON.stringify({
          statusCode: status,
          message: typeof response === 'string' ? response : (response as any).message,
          error: (response as any).error,
        }),
      );
    }
    
    // Allow HTTP exceptions to bubble up if it's an HTTP request
    if (host.getType() === 'http') {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.getStatus();
        response.status(status).json(exception.getResponse());
    }

    return exception;
  }
}
