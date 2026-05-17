import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './models/post.model';
import { CreatePostInput } from './dto/create-post.input';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
  ) {}

  async create(createPostDto: CreatePostInput, authorId: string): Promise<Post> {
    const createdPost = new this.postModel({ ...createPostDto, authorId });
    return createdPost.save();
  }

  async findPaginated(skip: number, limit: number): Promise<{ items: Post[]; totalCount: number }> {
    const [items, totalCount] = await Promise.all([
      this.postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.postModel.countDocuments().exec(),
    ]);
    return { items, totalCount };
  }

  async findById(id: string): Promise<Post | null> {
    return this.postModel.findById(id).exec();
  }

  async update(id: string, updateData: Partial<Post>): Promise<Post | null> {
    return this.postModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<Post | null> {
    return this.postModel.findByIdAndDelete(id).exec();
  }

  async incrementCommentsCount(id: string, amount: number): Promise<void> {
    await this.postModel.findByIdAndUpdate(id, { $inc: { commentsCount: amount } }).exec();
  }
}
