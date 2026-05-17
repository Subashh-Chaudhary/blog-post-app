import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getGraphQLConfig = (
  configService: ConfigService,
): ApolloDriverConfig => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: !isProduction,
    introspection: !isProduction,
    formatError: (error) => {
      // Preserve extensions.code so Apollo Client errorLink can detect UNAUTHENTICATED
      const originalError = error.extensions?.originalError as any;
      const code = error.extensions?.code;
      const httpStatus = (error.extensions?.http as any)?.status;

      if (!originalError) {
        return {
          message: error.message,
          extensions: { code, http: { status: httpStatus } },
        };
      }
      return {
        message: originalError.message,
        extensions: {
          code,
          http: { status: httpStatus },
          details: originalError.error || originalError.message,
        },
      };
    },
  };
};
