import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/models/paginated.model';
import { Comment } from './comment.model';

@ObjectType()
export class PaginatedComments extends Paginated(Comment) {}
