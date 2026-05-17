import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';
import { UserDataLoader } from '../../common/dataloaders/user.dataloader';
import { PaginationInput } from '../../common/dto/pagination.input';
import { PaginatedComments } from './models/paginated-comments.model';
import { IPaginatedType } from '../../common/interfaces/paginated.interface';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly userDataLoader: UserDataLoader,
  ) {}

  @Query(() => PaginatedComments, { name: 'commentsByPost' })
  async getCommentsByPost(
    @Args('postId', { type: () => ID }) postId: string,
    @Args('paginationInput', { nullable: true }) paginationInput?: PaginationInput,
  ): Promise<IPaginatedType<Comment>> {
    const input = paginationInput || new PaginationInput();
    return this.commentsService.getCommentsByPostId(postId, input);
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() comment: Comment): Promise<User | null> {
    if (!comment.userId) return null;
    // DataLoader batches all user lookups in a single request into ONE DB query
    return this.userDataLoader.load(comment.userId);
  }

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  async addComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    return this.commentsService.createComment(createCommentInput, currentUser);
  }

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  async updateComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    return this.commentsService.updateComment(id, updateCommentInput, currentUser);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.commentsService.deleteComment(id, currentUser);
  }
}
