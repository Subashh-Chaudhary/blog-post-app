import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './models/comment.model';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => PostsModule),
    UsersModule,
  ],
  providers: [CommentsResolver, CommentsService, CommentsRepository],
})
export class CommentsModule {}
