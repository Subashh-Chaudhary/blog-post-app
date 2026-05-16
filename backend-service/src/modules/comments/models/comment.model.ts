import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType()
@Schema({ timestamps: true, versionKey: false })
export class Comment {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  @Prop({ required: true, type: String })
  postId: string;

  @Field(() => ID)
  @Prop({ required: true, type: String })
  userId: string;

  @Field(() => User, { nullable: true })
  user: User;

  @Field()
  @Prop({ required: true })
  content: string;

  @Field(() => ID, { nullable: true })
  @Prop({ type: String, default: null })
  parentCommentId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
