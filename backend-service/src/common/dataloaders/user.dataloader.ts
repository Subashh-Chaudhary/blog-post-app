import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { UsersRepository } from '../../modules/users/users.repository';
import { User } from '../../modules/users/models/user.model';

/**
 * UserDataLoader - REQUEST-SCOPED DataLoader for batching user lookups.
 *
 * Scope.REQUEST ensures a NEW instance is created per incoming GraphQL request.
 * This means:
 *   - Batching: All `load(id)` calls within the same execution tick (same request)
 *     are collected and fired as ONE MongoDB query: { $in: [id1, id2, ...] }
 *   - Caching: Within the same request, if the same userId is requested twice
 *     (e.g., two comments by the same author), only ONE DB call is made.
 *   - Isolation: Cache is never shared between different user requests.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserDataLoader {
  private readonly loader: DataLoader<string, User | null>;

  constructor(private readonly usersRepository: UsersRepository) {
    this.loader = new DataLoader<string, User | null>(
      async (ids: readonly string[]) => {
        // ONE single batched DB query instead of N individual queries
        const users = await this.usersRepository.findByIds([...ids]);

        // DataLoader requires results to be returned in the EXACT same order
        // as the requested keys. We build a Map for O(1) lookup.
        const userMap = new Map<string, User>(
          users.map((u) => [u._id.toString(), u]),
        );

        // For any missing user, return null gracefully rather than throwing
        return ids.map((id) => userMap.get(id) ?? null);
      },
      {
        // Per-request in-memory cache (default: true)
        // Prevents fetching the same user twice in the same request
        cache: true,
        // Max batch size — safety limit to avoid oversized $in queries
        maxBatchSize: 100,
      },
    );
  }

  /**
   * Loads a single user by ID.
   * Calls within the same tick are automatically batched together.
   */
  async load(id: string): Promise<User | null> {
    return this.loader.load(id);
  }
}
