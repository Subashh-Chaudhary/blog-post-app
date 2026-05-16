import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment } from './models/comment.model';
import { User } from '../users/models/user.model';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsService: PostsService,
  ) {}

  async createComment(createCommentInput: CreateCommentInput, currentUser: User): Promise<Comment> {
    // Verify post exists
    await this.postsService.getPostById(createCommentInput.postId);
    
    const comment = await this.commentsRepository.create(createCommentInput, currentUser._id.toString());
    
    // Increment commentsCount on the Post
    await this.postsService.incrementCommentsCount(createCommentInput.postId, 1);
    
    return comment;
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.commentsRepository.findAllByPostId(postId);
  }

  async getCommentById(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async updateComment(id: string, updateCommentInput: UpdateCommentInput, currentUser: User): Promise<Comment> {
    const comment = await this.getCommentById(id);
    if (comment.userId !== currentUser._id.toString()) {
      throw new ForbiddenException('You can only update your own comments');
    }
    const updatedComment = await this.commentsRepository.update(id, updateCommentInput);
    if (!updatedComment) throw new NotFoundException(`Comment with ID ${id} not found`);
    return updatedComment;
  }

  async deleteComment(id: string, currentUser: User): Promise<boolean> {
    const comment = await this.getCommentById(id);
    if (comment.userId !== currentUser._id.toString()) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    const deleted = await this.commentsRepository.delete(id);
    
    if (deleted) {
      // Decrement commentsCount on the Post
      await this.postsService.incrementCommentsCount(comment.postId, -1);
    }
    
    return !!deleted;
  }
}
