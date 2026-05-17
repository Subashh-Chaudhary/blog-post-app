"use client";

import { useQuery } from "@apollo/client/react";
import { GET_POSTS_QUERY } from "@/lib/graphql/documents";
import { PaginatedPosts } from "@/lib/graphql/types";
import PostCard from "@/components/posts/PostCard";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Home() {
  const { data, loading, error, fetchMore } = useQuery<{ posts: PaginatedPosts }>(GET_POSTS_QUERY, {
    variables: { paginationInput: { page: 1, limit: 10 } },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const handlePageChange = (newPage: number) => {
    fetchMore({
      variables: { paginationInput: { page: newPage, limit: 10 } },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      },
    });
  };

  if (loading && !data) {
    return (
      <div className="col-span-12 space-y-8 animate-pulse">
        {/* Hero Skeleton */}
        <div className="w-full h-80 bg-surface/50 rounded-2xl border border-border"></div>
        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-surface/50 rounded-2xl border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-12 py-20 text-center">
        <h2 className="text-2xl font-display text-accentWarm mb-4">Error loading posts</h2>
        <p className="text-textSecondary">{error.message}</p>
      </div>
    );
  }

  const posts = data?.posts.items || [];
  const pagination = data?.posts;

  if (posts.length === 0) {
    return (
      <div className="col-span-12 py-32 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-surfaceGlass flex items-center justify-center border border-border">
          <span className="text-4xl">📭</span>
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">No posts yet</h2>
        <p className="text-textSecondary mb-8 max-w-md">
          Be the first to share your thoughts with the community.
        </p>
      </div>
    );
  }

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="col-span-12">
      {/* Featured Post (if page 1) */}
      {pagination?.currentPage === 1 && featuredPost && (
        <div className="mb-12">
          <PostCard post={featuredPost} index={0} featured />
        </div>
      )}

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {remainingPosts.map((post, index) => (
          <PostCard key={post._id} post={post} index={index + 1} />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-8 py-8 border-t border-border/50">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
            className="group flex items-center gap-2 text-sm font-medium text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Previous
          </button>
          
          <span className="text-sm font-mono text-textMuted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="group flex items-center gap-2 text-sm font-medium text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
