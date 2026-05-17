import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { Post, PostSchema } from './models/post.model';
import { PostLike, PostLikeSchema } from './models/post-like.model';
import { PostLikesRepository } from './post-likes.repository';
import { PostLikeDataLoader } from '../../common/dataloaders/post-like.dataloader';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: PostLike.name, schema: PostLikeSchema },
    ]),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  providers: [
    PostsResolver,
    PostsService,
    PostsRepository,
    PostLikesRepository,
    PostLikeDataLoader,
  ],
  exports: [PostsService],
})
export class PostsModule {}
