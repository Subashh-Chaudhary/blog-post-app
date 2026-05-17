import { gql } from '@apollo/client/core';

export const REGISTER_MUTATION = gql`
  mutation Register($dto: RegisterDto!) {
    register(registerDto: $dto) {
      accessToken
      refreshToken
      user {
        _id
        fullName
        email
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($dto: LoginDto!) {
    login(loginDto: $dto) {
      accessToken
      refreshToken
      user {
        _id
        fullName
        email
      }
    }
  }
`;

export const REFRESH_MUTATION = gql`
  mutation Refresh($token: String!) {
    refresh(refreshToken: $token) {
      accessToken
      refreshToken
      user {
        _id
        fullName
        email
      }
    }
  }
`;

export const GET_POSTS_QUERY = gql`
  query GetPosts($paginationInput: PaginationInput) {
    posts(paginationInput: $paginationInput) {
      totalCount
      currentPage
      totalPages
      limit
      hasNextPage
      hasPreviousPage
      items {
        _id
        title
        content
        commentsCount
        likeCount
        isLiked
        createdAt
        author {
          _id
          fullName
        }
        likedBy {
          _id
          fullName
        }
      }
    }
  }
`;

export const GET_POST_QUERY = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      _id
      title
      content
      published
      authorId
      commentsCount
      likeCount
      isLiked
      createdAt
      updatedAt
      author {
        _id
        fullName
        createdAt
      }
      likedBy {
        _id
        fullName
      }
    }
  }
`;

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(createPostInput: $input) {
      _id
      title
    }
  }
`;

export const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, updatePostInput: $input) {
      _id
      title
      content
    }
  }
`;

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const GET_COMMENTS_QUERY = gql`
  query GetComments($postId: ID!, $paginationInput: PaginationInput) {
    commentsByPost(postId: $postId, paginationInput: $paginationInput) {
      totalCount
      currentPage
      totalPages
      limit
      hasNextPage
      hasPreviousPage
      items {
        _id
        content
        userId
        createdAt
        updatedAt
        user {
          fullName
        }
      }
    }
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($input: CreateCommentInput!) {
    addComment(createCommentInput: $input) {
      _id
      content
    }
  }
`;

export const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($id: ID!, $input: UpdateCommentInput!) {
    updateComment(id: $id, updateCommentInput: $input) {
      _id
      content
    }
  }
`;

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const TOGGLE_POST_LIKE_MUTATION = gql`
  mutation TogglePostLike($postId: ID!) {
    togglePostLike(postId: $postId) {
      liked
      likeCount
    }
  }
`;
