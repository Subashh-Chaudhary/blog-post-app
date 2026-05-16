import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException) {
    const response = exception.getResponse();
    const status = exception.getStatus();

    const message = typeof response === 'string' ? response : (response as any).message;
    const error = (response as any).error;

    return new GraphQLError(message, {
      extensions: {
        code: status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_USER_INPUT',
        http: { status },
        details: error,
      },
    });
  }
}
