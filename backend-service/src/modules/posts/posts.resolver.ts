import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';
import { UserDataLoader } from '../../common/dataloaders/user.dataloader';
import { PaginationInput } from '../../common/dto/pagination.input';
import { PaginatedPosts } from './models/paginated-posts.model';
import { IPaginatedType } from '../../common/interfaces/paginated.interface';
import { OptionalGqlAuthGuard } from '../../common/guards/optional-gql-auth.guard';
import { PostLikeDataLoader } from '../../common/dataloaders/post-like.dataloader';
import { TogglePostLikeResponse } from './dto/toggle-post-like.response';
import { PostLikesRepository } from './post-likes.repository';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly userDataLoader: UserDataLoader,
    private readonly postLikeDataLoader: PostLikeDataLoader,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  @Query(() => PaginatedPosts, { name: 'posts' })
  @UseGuards(OptionalGqlAuthGuard)
  async getPosts(
    @Args('paginationInput', { nullable: true }) paginationInput?: PaginationInput,
  ): Promise<IPaginatedType<Post>> {
    const input = paginationInput || new PaginationInput();
    return this.postsService.getPosts(input);
  }

  @Query(() => Post, { name: 'post' })
  @UseGuards(OptionalGqlAuthGuard)
  async getPostById(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    return this.postsService.getPostById(id);
  }

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() post: Post): Promise<User | null> {
    if (!post.authorId) return null;
    return this.userDataLoader.load(post.authorId);
  }

  @ResolveField(() => Boolean)
  async isLiked(@Parent() post: Post, @CurrentUser() user?: User): Promise<boolean> {
    if (!user) return false;
    return this.postLikeDataLoader.load(user._id.toString(), post._id.toString());
  }

  @ResolveField(() => [User])
  async likedBy(@Parent() post: Post): Promise<User[]> {
    const likes = await this.postLikesRepository.findRecentLikesForPost(post._id.toString(), 20);
    if (!likes.length) return [];
    const users = await Promise.all(likes.map(like => this.userDataLoader.load(like.userId)));
    return users.filter((u): u is User => u !== null);
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

  @Mutation(() => TogglePostLikeResponse)
  @UseGuards(GqlAuthGuard)
  async togglePostLike(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() currentUser: User,
  ): Promise<TogglePostLikeResponse> {
    return this.postsService.togglePostLike(postId, currentUser._id.toString());
  }
}
