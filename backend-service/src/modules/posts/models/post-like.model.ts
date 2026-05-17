import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Schema({ timestamps: true, versionKey: false, collection: 'post_likes' })
export class PostLike {
  @Field(() => ID)
  _id: string;

  @Field(() => ID)
  @Prop({ required: true, type: String })
  userId: string;

  @Field(() => ID)
  @Prop({ required: true, type: String })
  postId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

// Ensure a user can only like a post once
PostLikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
