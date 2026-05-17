import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { Post } from './models/post.model';
import { User } from '../users/models/user.model';
import { PaginationInput } from '../../common/dto/pagination.input';
import { IPaginatedType } from '../../common/interfaces/paginated.interface';
import { PostLikesRepository } from './post-likes.repository';
import { TogglePostLikeResponse } from './dto/toggle-post-like.response';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async createPost(createPostInput: CreatePostInput, currentUser: User): Promise<Post> {
    return this.postsRepository.create(createPostInput, currentUser._id.toString());
  }

  async getPosts(paginationInput: PaginationInput): Promise<IPaginatedType<Post>> {
    const { page, limit } = paginationInput;
    const skip = (page - 1) * limit;
    const { items, totalCount } = await this.postsRepository.findPaginated(skip, limit);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async updatePost(id: string, updatePostInput: UpdatePostInput, currentUser: User): Promise<Post> {
    const post = await this.getPostById(id);
    if (post.authorId !== currentUser._id.toString()) {
      throw new ForbiddenException('You can only update your own posts');
    }
    const updatedPost = await this.postsRepository.update(id, updatePostInput);
    if (!updatedPost) throw new NotFoundException(`Post with ID ${id} not found`);
    return updatedPost;
  }

  async deletePost(id: string, currentUser: User): Promise<boolean> {
    const post = await this.getPostById(id);
    if (post.authorId !== currentUser._id.toString()) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    const deleted = await this.postsRepository.delete(id);
    return !!deleted;
  }

  async incrementCommentsCount(id: string, amount: number): Promise<void> {
    await this.postsRepository.incrementCommentsCount(id, amount);
  }

  async togglePostLike(postId: string, userId: string): Promise<TogglePostLikeResponse> {
    const post = await this.getPostById(postId);
    const existingLike = await this.postLikesRepository.findByUserAndPost(userId, postId);

    if (existingLike) {
      await this.postLikesRepository.delete(postId, userId);
      const updatedPost = await this.postsRepository.incrementLikeCount(postId, -1);
      return {
        liked: false,
        likeCount: updatedPost ? updatedPost.likeCount : Math.max(0, post.likeCount - 1),
      };
    } else {
      await this.postLikesRepository.create(postId, userId);
      const updatedPost = await this.postsRepository.incrementLikeCount(postId, 1);
      return {
        liked: true,
        likeCount: updatedPost ? updatedPost.likeCount : post.likeCount + 1,
      };
    }
  }
}
