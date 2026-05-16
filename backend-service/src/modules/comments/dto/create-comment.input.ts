import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  postId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  parentCommentId?: string;
}
