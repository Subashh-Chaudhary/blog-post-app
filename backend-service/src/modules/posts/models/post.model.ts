import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType()
@Schema({ timestamps: true, versionKey: false })
export class Post {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ required: true })
  content: string;

  @Field()
  @Prop({ default: false })
  published: boolean;

  @Field(() => ID)
  @Prop({ required: true, type: String })
  authorId: string;

  @Field(() => Int)
  @Prop({ default: 0 })
  commentsCount: number;

  @Field(() => User, { nullable: true })
  author: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
