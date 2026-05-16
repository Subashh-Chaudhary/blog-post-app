import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(100)
  title: string;

  @Field()
  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
