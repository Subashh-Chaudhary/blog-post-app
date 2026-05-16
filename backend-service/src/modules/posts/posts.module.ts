import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { Post, PostSchema } from './models/post.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  providers: [PostsResolver, PostsService, PostsRepository],
  exports: [PostsService],
})
export class PostsModule {}
