import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { Post, PostSchema } from './models/post.model';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  providers: [PostsResolver, PostsService, PostsRepository],
  exports: [PostsService],
})
export class PostsModule {}
