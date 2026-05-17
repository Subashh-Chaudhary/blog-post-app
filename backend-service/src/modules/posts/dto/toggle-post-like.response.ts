import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TogglePostLikeResponse {
  @Field(() => Boolean)
  liked: boolean;

  @Field(() => Int)
  likeCount: number;
}
