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
      // Abstracting error details for a clean response format
      const originalError = error.extensions?.originalError as any;
      if (!originalError) {
        return {
          message: error.message,
          code: error.extensions?.code,
        };
      }
      return {
        message: originalError.message,
        code: error.extensions?.code,
        details: originalError.error || originalError.message,
      };
    },
  };
};
