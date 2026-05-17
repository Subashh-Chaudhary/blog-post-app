import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PostLikesRepository } from '../../modules/posts/post-likes.repository';

@Injectable({ scope: Scope.REQUEST })
export class PostLikeDataLoader {
  private readonly loader: DataLoader<string, boolean>;

  constructor(private readonly postLikesRepository: PostLikesRepository) {
    this.loader = new DataLoader<string, boolean>(
      async (keys: readonly string[]) => {
        // keys are in format "userId:postId"
        const pairs = keys.map((key) => {
          const [userId, postId] = key.split(':');
          return { userId, postId };
        });

        const likes = await this.postLikesRepository.findByPairs(pairs);

        // Create a fast lookup Set
        const likeSet = new Set(likes.map((like) => `${like.userId}:${like.postId}`));

        // Return a boolean array matching the keys order
        return keys.map((key) => likeSet.has(key));
      },
      { cache: true, maxBatchSize: 100 },
    );
  }

  async load(userId: string, postId: string): Promise<boolean> {
    return this.loader.load(`${userId}:${postId}`);
  }
}
