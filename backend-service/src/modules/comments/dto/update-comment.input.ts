import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;
}
