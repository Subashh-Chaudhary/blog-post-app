"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/lib/graphql/types";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import clsx from "clsx";
import LikeButton from "./LikeButton";

interface PostCardProps {
  post: Post;
  index: number;
  featured?: boolean;
}

export default function PostCard({ post, index, featured = false }: PostCardProps) {
  const authorInitials = post.author?.fullName
    ? post.author.fullName.substring(0, 2).toUpperCase()
    : "U";

  // Deterministic color hashing based on author ID
  const hash = post.author?._id
    ? post.author._id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  
  const colors = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "bg-rose-500/20 text-rose-400 border-rose-500/30"
  ];
  
  const avatarColor = colors[hash % colors.length];

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href={`/posts/${post._id}`}
          className="group block relative rounded-2xl overflow-hidden glass-panel border-accent/20 hover:border-accentGlow transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border", avatarColor)}>
                {authorInitials}
              </div>
              <div>
                <div className="text-sm font-medium">{post.author?.fullName || "Unknown"}</div>
                <div className="text-xs font-mono text-textMuted" suppressHydrationWarning>
                  {formatDistanceToNow(new Date(!isNaN(Number(post.createdAt)) ? Number(post.createdAt) : post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            
            <p className="text-textSecondary text-lg line-clamp-3 mb-8 max-w-3xl">
              {post.content.replace(/<[^>]*>?/gm, '') /* basic strip tags if markdown */}
            </p>

            <div className="flex items-center gap-2">
              <LikeButton post={post} showLabel={true} />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 border border-border text-xs font-mono text-textSecondary">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.commentsCount} comments
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Regular Card
  // Asymmetric alignment logic
  const isRightHeavy = index % 2 !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        href={`/posts/${post._id}`}
        className="group block relative glass-panel p-6 rounded-2xl hover:-translate-y-1 hover:border-accentGlow transition-all duration-300"
      >
        <div className={clsx("flex flex-col h-full", { "items-end text-right": isRightHeavy })}>
          <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className={clsx("text-textSecondary text-sm line-clamp-2 mb-6 max-w-lg", { "ml-auto": isRightHeavy })}>
            {post.content.replace(/<[^>]*>?/gm, '')}
          </p>

          <div className="mt-auto flex items-center gap-4 w-full" style={{ flexDirection: isRightHeavy ? 'row-reverse' : 'row' }}>
            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border shrink-0", avatarColor)}>
              {authorInitials}
            </div>
            <div className={clsx("flex flex-col", { "items-end": isRightHeavy })}>
              <div className="text-xs font-medium">{post.author?.fullName || "Unknown"}</div>
              <div className="text-[10px] font-mono text-textMuted" suppressHydrationWarning>
                {formatDistanceToNow(new Date(!isNaN(Number(post.createdAt)) ? Number(post.createdAt) : post.createdAt), { addSuffix: true })}
              </div>
            </div>
            
            <div className={clsx("flex items-center gap-2 shrink-0", {
              "mr-auto": isRightHeavy,
              "ml-auto": !isRightHeavy
            })}>
              <LikeButton post={post} />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/50 border border-border text-[10px] font-mono text-textSecondary">
                <MessageSquare className="w-3 h-3" />
                {post.commentsCount}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
