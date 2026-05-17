export interface User {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  author?: User | null;
  commentsCount: number;
  likeCount: number;
  isLiked: boolean;
  likedBy?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User | null;
}

export interface IPaginatedType<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type PaginatedPosts = IPaginatedType<Post>;
export type PaginatedComments = IPaginatedType<Comment>;

export interface LoginDto {
  email: string;
  password: string; 
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  published?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  published?: boolean;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface TogglePostLikeResponse {
  __typename?: string;
  liked: boolean;
  likeCount: number;
}
