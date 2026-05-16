import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostInput } from './dto/create-post.input';
import { Post } from './models/post.model';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async createPost(createPostInput: CreatePostInput): Promise<Post> {
    return this.postsRepository.create(createPostInput);
  }

  async getPosts(): Promise<Post[]> {
    return this.postsRepository.findAll();
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async deletePost(id: string): Promise<boolean> {
    const deleted = await this.postsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return true;
  }
}
