import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Document } from 'mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class Post extends Document {
  @Field(() => ID)
  id: string;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ required: true })
  content: string;

  @Field()
  @Prop({ default: false })
  published: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
