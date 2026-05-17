"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_POST_QUERY, DELETE_POST_MUTATION } from "@/lib/graphql/documents";
import { Post } from "@/lib/graphql/types";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Edit3, Trash2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import CommentsSection from "@/components/comments/CommentsSection";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, loading, error } = useQuery<{ post: Post }>(GET_POST_QUERY, {
    variables: { id: postId },
  });

  const [deletePost, { loading: isDeleting }] = useMutation(DELETE_POST_MUTATION, {
    variables: { id: postId },
    onCompleted: () => {
      addToast("Post deleted successfully", "success");
      router.push("/");
    },
    onError: (err) => {
      addToast(err.message || "Failed to delete post", "error");
    },
  });

  if (loading) {
    return (
      <div className="col-span-12 animate-pulse space-y-8 max-w-4xl mx-auto w-full pt-10">
        <div className="w-3/4 h-16 bg-surface/50 rounded-xl" />
        <div className="w-1/4 h-6 bg-surface/50 rounded-xl" />
        <div className="space-y-4 pt-10">
          <div className="w-full h-4 bg-surface/50 rounded" />
          <div className="w-full h-4 bg-surface/50 rounded" />
          <div className="w-5/6 h-4 bg-surface/50 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data?.post) {
    return (
      <div className="col-span-12 py-20 text-center">
        <h2 className="text-2xl font-display text-accentWarm mb-4">Post not found</h2>
        <Link href="/" className="text-accent hover:underline">Return to feed</Link>
      </div>
    );
  }

  const post = data.post;
  const isAuthor = user?._id === post.authorId;
  
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
  const authorInitials = post.author?.fullName?.substring(0, 2).toUpperCase() || "U";
  
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <div className="col-span-12 lg:col-span-7 xl:col-span-8 pr-0 lg:pr-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-mono text-textSecondary hover:text-accent transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Back to feed
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-[1.1] mb-6 drop-shadow-sm">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-3 font-mono text-textSecondary">
              <span className="text-accent">{post.author?.fullName || "Unknown"}</span>
              <span>•</span>
              <span suppressHydrationWarning>{format(new Date(!isNaN(Number(post.createdAt)) ? Number(post.createdAt) : post.createdAt), "MMMM d, yyyy")}</span>
            </div>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-accent hover:prose-a:text-accentGlow prose-p:leading-relaxed prose-pre:bg-surface/50 prose-pre:border prose-pre:border-border">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </motion.article>

        {/* Comments Section */}
        <div className="mt-20 pt-16 border-t border-border/50 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
          <CommentsSection postId={postId} />
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 xl:col-span-4 mt-12 lg:mt-0 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="sticky top-28 glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-xs font-mono font-bold text-textSecondary uppercase tracking-widest mb-6">About the Author</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg border ${avatarColor}`}>
              {authorInitials}
            </div>
            <div>
              <div className="font-medium text-lg">{post.author?.fullName || "Unknown"}</div>
              <div className="text-sm text-textSecondary" suppressHydrationWarning>Joined {post.author?.createdAt ? formatDistanceToNow(new Date(!isNaN(Number(post.author.createdAt)) ? Number(post.author.createdAt) : post.author.createdAt), { addSuffix: true }) : "recently"}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50 mb-6">
            <div>
              <div className="text-xs text-textSecondary font-mono mb-1">Words</div>
              <div className="font-medium">{wordCount}</div>
            </div>
            <div>
              <div className="text-xs text-textSecondary font-mono mb-1">Read Time</div>
              <div className="font-medium">{readTime} min</div>
            </div>
          </div>

          {isAuthor && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-textSecondary uppercase tracking-widest mb-3">Manage Post</h3>
              
              <Link
                href={`/posts/${post._id}/edit`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border bg-surface/50 hover:bg-surface hover:border-accent/50 transition-colors text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" /> Edit Post
              </Link>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border bg-surface/50 hover:bg-accentWarm/10 hover:border-accentWarm/30 hover:text-accentWarm transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Post
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-xl border border-accentWarm/30 bg-accentWarm/5 overflow-hidden"
                >
                  <div className="flex gap-3 mb-4 text-accentWarm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">Are you sure? This action cannot be undone.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg bg-surface border border-border hover:bg-surface/80 transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deletePost()}
                      className="flex-1 py-2 text-sm font-medium rounded-lg bg-accentWarm text-white hover:bg-accentWarm/90 transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
