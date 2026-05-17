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

    let code: string;
    if (status === 401) {
      code = 'UNAUTHENTICATED';
    } else if (status === 403) {
      code = 'FORBIDDEN';
    } else if (status >= 500) {
      code = 'INTERNAL_SERVER_ERROR';
    } else {
      code = 'BAD_USER_INPUT';
    }

    return new GraphQLError(message, {
      extensions: {
        code,
        http: { status },
        details: error,
      },
    });
  }
}
