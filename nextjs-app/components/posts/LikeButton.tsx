"use client";

import { useMutation } from "@apollo/client/react";
import { TOGGLE_POST_LIKE_MUTATION, GET_POST_QUERY, GET_POSTS_QUERY } from "@/lib/graphql/documents";
import { TogglePostLikeResponse } from "@/lib/graphql/types";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface LikeButtonProps {
  post: {
    _id: string;
    isLiked: boolean;
    likeCount: number;
  };
  showLabel?: boolean;
}

export default function LikeButton({ post, showLabel = false }: LikeButtonProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const isActuallyLiked = !!user && post.isLiked;

  const [toggleLike, { loading }] = useMutation<{ togglePostLike: TogglePostLikeResponse }>(TOGGLE_POST_LIKE_MUTATION, {
    variables: { postId: post._id },
    refetchQueries: [
      {
        query: GET_POSTS_QUERY,
        variables: { paginationInput: { page: 1, limit: 10 } }
      },
      {
        query: GET_POST_QUERY,
        variables: { id: post._id }
      }
    ],
    optimisticResponse: {
      togglePostLike: {
        __typename: "TogglePostLikeResponse",
        liked: !isActuallyLiked,
        likeCount: isActuallyLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1,
      },
    },
    update(cache, { data }) {
      if (!data?.togglePostLike) return;
      const { liked, likeCount } = data.togglePostLike;
      
      cache.modify({
        id: cache.identify({ __typename: "Post", _id: post._id }),
        fields: {
          isLiked() {
            return liked;
          },
          likeCount() {
            return likeCount;
          },
        },
      });
    },
    onError: (err) => {
      addToast(err.message || "Failed to toggle like", "error");
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent triggering any Link wrappers
    if (!user) {
      addToast("Please log in to like posts", "error");
      return;
    }
    toggleLike();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading && false} // Disable actually blocks the click, but we want it responsive so we might not disable. Let's just allow it, Apollo deduplicates inflight slightly or handles it well. We'll leave disabled off for optimistic speed.
      className={clsx(
        "flex items-center gap-1.5 transition-colors group",
        showLabel 
          ? "px-3 py-1.5 rounded-full bg-surface/80 border border-border text-xs font-mono text-textSecondary hover:border-red-500/50 hover:bg-red-500/10" 
          : "text-textSecondary hover:text-red-500"
      )}
    >
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={isActuallyLiked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={clsx(
            showLabel ? "w-3.5 h-3.5" : "w-4 h-4", 
            isActuallyLiked ? "fill-red-500 text-red-500" : "group-hover:text-red-400"
          )} 
        />
      </motion.div>
      <span className={clsx(isActuallyLiked && "text-red-500")}>
        {showLabel ? `${post.likeCount} likes` : post.likeCount}
      </span>
    </button>
  );
}
