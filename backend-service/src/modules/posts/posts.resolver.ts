import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => [Post], { name: 'posts' })
  async getPosts(): Promise<Post[]> {
    return this.postsService.getPosts();
  }

  @Query(() => Post, { name: 'post' })
  async getPostById(@Args('id') id: string): Promise<Post> {
    return this.postsService.getPostById(id);
  }

  @Mutation(() => Post)
  async createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
  ): Promise<Post> {
    return this.postsService.createPost(createPostInput);
  }

  @Mutation(() => Boolean)
  async deletePost(@Args('id') id: string): Promise<boolean> {
    return this.postsService.deletePost(id);
  }
}
