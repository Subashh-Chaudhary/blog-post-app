import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserDataLoader } from '../../common/dataloaders/user.dataloader';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersRepository, UsersService, UserDataLoader],
  exports: [UsersService, UserDataLoader],
})
export class UsersModule {}
