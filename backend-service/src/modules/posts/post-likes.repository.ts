import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostLike } from './models/post-like.model';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectModel(PostLike.name) private readonly postLikeModel: Model<PostLike>,
  ) {}

  async create(postId: string, userId: string): Promise<PostLike> {
    const postLike = new this.postLikeModel({ postId, userId });
    return postLike.save();
  }

  async delete(postId: string, userId: string): Promise<PostLike | null> {
    return this.postLikeModel.findOneAndDelete({ postId, userId }).exec();
  }

  async findByUserAndPost(userId: string, postId: string): Promise<PostLike | null> {
    return this.postLikeModel.findOne({ userId, postId }).exec();
  }

  async findByPairs(pairs: { userId: string; postId: string }[]): Promise<PostLike[]> {
    if (!pairs.length) return [];
    return this.postLikeModel.find({ $or: pairs }).exec();
  }

  async findRecentLikesForPost(postId: string, limit: number = 20): Promise<PostLike[]> {
    return this.postLikeModel
      .find({ postId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
