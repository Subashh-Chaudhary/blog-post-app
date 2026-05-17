import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/models/paginated.model';
import { Post } from './post.model';

@ObjectType()
export class PaginatedPosts extends Paginated(Post) {}
