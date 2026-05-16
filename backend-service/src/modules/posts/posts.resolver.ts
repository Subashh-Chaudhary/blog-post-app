import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => [Post], { name: 'posts' })
  async getPosts(): Promise<Post[]> {
    return this.postsService.getPosts();
  }

  @Query(() => Post, { name: 'post' })
  async getPostById(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    return this.postsService.getPostById(id);
  }

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() post: Post): Promise<User | null> {
    if (!post.authorId) {
      return null;
    }
    try {
      return await this.usersService.findById(post.authorId);
    } catch (error) {
      return null;
    }
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() currentUser: User,
  ): Promise<Post> {
    return this.postsService.createPost(createPostInput, currentUser);
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @CurrentUser() currentUser: User,
  ): Promise<Post> {
    return this.postsService.updatePost(id, updatePostInput, currentUser);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.postsService.deletePost(id, currentUser);
  }
}
