import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvConfig } from '../config/env.config';

// Mongoose connection readyStates
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
const logger = new Logger('DatabaseModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<EnvConfig, true>) => {
        const uri = configService.get<string>('MONGODB_URI');
        return {
          uri,
          connectionFactory: (connection) => {
            // If already connected (readyState 1), log immediately
            if (connection.readyState === 1) {
              logger.log('Successfully connected to MongoDB');
            }

            connection.on('connected', () => {
              logger.log('Successfully connected to MongoDB');
            });

            connection.on('reconnected', () => {
              logger.log('MongoDB reconnected');
            });

            connection.on('error', (error: Error) => {
              logger.error(`MongoDB connection error: ${error.message}`);
            });

            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });

            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
