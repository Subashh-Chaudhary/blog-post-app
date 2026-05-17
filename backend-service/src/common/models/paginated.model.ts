import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IPaginatedType } from '../interfaces/paginated.interface';

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [classRef], { nullable: 'itemsAndList' })
    items: T[];

    @Field(() => Int)
    totalCount: number;

    @Field(() => Int)
    currentPage: number;

    @Field(() => Int)
    totalPages: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Boolean)
    hasNextPage: boolean;

    @Field(() => Boolean)
    hasPreviousPage: boolean;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
