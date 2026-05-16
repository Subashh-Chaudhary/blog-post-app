import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentInput, userId: string): Promise<Comment> {
    const createdComment = new this.commentModel({ ...createCommentDto, userId });
    return createdComment.save();
  }

  async findAllByPostId(postId: string): Promise<Comment[]> {
    return this.commentModel.find({ postId }).exec();
  }

  async findById(id: string): Promise<Comment | null> {
    return this.commentModel.findById(id).exec();
  }

  async update(id: string, updateData: UpdateCommentInput): Promise<Comment | null> {
    return this.commentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<Comment | null> {
    return this.commentModel.findByIdAndDelete(id).exec();
  }
}
