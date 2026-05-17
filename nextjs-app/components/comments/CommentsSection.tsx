"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  GET_COMMENTS_QUERY, 
  ADD_COMMENT_MUTATION, 
  UPDATE_COMMENT_MUTATION, 
  DELETE_COMMENT_MUTATION 
} from "@/lib/graphql/documents";
import { Comment, PaginatedComments } from "@/lib/graphql/types";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, MoreHorizontal, Edit2, Trash2, X, Send } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

interface CommentsSectionProps {
  postId: string;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [newComment, setNewComment] = useState("");
  
  const { data, loading, fetchMore, refetch } = useQuery<{ commentsByPost: PaginatedComments }>(GET_COMMENTS_QUERY, {
    variables: { postId, paginationInput: { page: 1, limit: 20 } },
    notifyOnNetworkStatusChange: true,
  });

  const [addComment, { loading: isAdding }] = useMutation(ADD_COMMENT_MUTATION, {
    onCompleted: () => {
      setNewComment("");
      refetch();
      addToast("Comment posted", "success");
    },
    onError: (err) => addToast(err.message || "Failed to post comment", "error"),
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isAdding) return;
    addComment({ variables: { input: { postId, content: newComment } } });
  };

  const comments = data?.commentsByPost.items || [];
  
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-display font-bold">Discussion</h2>
        <div className="px-2.5 py-1 rounded-full bg-surface/80 border border-border text-xs font-mono text-textSecondary">
          {data?.commentsByPost.totalCount || 0}
        </div>
      </div>

      {/* Add Comment */}
      <div className="mb-10">
        {user ? (
          <form onSubmit={handleAddComment} className="relative">
            <div className="glass-panel p-4 rounded-xl border-accent/20 focus-within:border-accentGlow transition-colors">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                placeholder="Share your thoughts..."
                className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 min-h-[80px] text-textPrimary placeholder:text-textSecondary/50 text-sm"
              />
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                <span className={clsx("text-xs font-mono", newComment.length > 450 ? "text-accentWarm" : "text-textMuted")}>
                  {newComment.length} / 500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isAdding}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isAdding ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="glass-panel p-8 rounded-xl text-center flex flex-col items-center justify-center border-dashed border-border">
            <MessageSquare className="w-8 h-8 text-textMuted mb-3" />
            <p className="text-textSecondary mb-4">Join the conversation — Sign in to comment</p>
            <Link
              href="/login"
              className="px-6 py-2 rounded-full bg-surface border border-border hover:border-accent hover:text-accent transition-colors text-sm font-medium"
            >
              Sign In to Comment
            </Link>
          </div>
        )}
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {loading && comments.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface/50 rounded-xl" />
            ))}
          </div>
        ) : comments.length > 0 ? (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} currentUser={user} onRefresh={() => refetch()} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-10 text-textMuted text-sm font-mono border border-dashed border-border rounded-xl">
            No comments yet. Be the first to start the discussion!
          </div>
        )}
      </div>
    </section>
  );
}

// Separate component for individual comment to manage edit/delete state
function CommentItem({ comment, currentUser, onRefresh }: { comment: Comment, currentUser: any, onRefresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToastStore();
  
  const isAuthor = currentUser?._id === comment.userId;
  const authorInitials = comment.user?.fullName?.substring(0, 2).toUpperCase() || "U";
  
  const hash = comment.userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "bg-rose-500/20 text-rose-400 border-rose-500/30"
  ];
  const avatarColor = colors[hash % colors.length];

  const [updateComment, { loading: isUpdating }] = useMutation(UPDATE_COMMENT_MUTATION, {
    onCompleted: () => {
      setIsEditing(false);
      addToast("Comment updated", "success");
    },
    onError: (err) => addToast(err.message, "error"),
  });

  const [deleteComment, { loading: isDeleting }] = useMutation(DELETE_COMMENT_MUTATION, {
    onCompleted: () => {
      onRefresh();
      addToast("Comment deleted", "success");
    },
    onError: (err) => addToast(err.message, "error"),
  });

  const handleUpdate = () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    updateComment({ variables: { id: comment._id, input: { content: editContent } } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass-panel p-5 rounded-xl border-transparent hover:border-border transition-colors"
    >
      <div className="flex gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border shrink-0 ${avatarColor}`}>
          {authorInitials}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={clsx("text-sm font-medium", { "text-accent": isAuthor })}>{comment.user?.fullName || "Unknown"}</span>
              <span className="text-[10px] font-mono text-textMuted">•</span>
              <span className="text-[10px] font-mono text-textMuted" suppressHydrationWarning>
                {formatDistanceToNow(new Date(!isNaN(Number(comment.createdAt)) ? Number(comment.createdAt) : comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            {isAuthor && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-textSecondary hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="p-1.5 text-textSecondary hover:text-accentWarm hover:bg-accentWarm/10 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-surface/50 border border-border rounded-lg p-3"
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 min-h-[60px] text-sm text-textPrimary"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                    className="px-3 py-1 text-xs font-medium text-textSecondary hover:text-textPrimary transition-colors"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={!editContent.trim() || isUpdating}
                    className="px-3 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                </div>
              </motion.div>
            ) : showConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-accentWarm/5 border border-accentWarm/20 rounded-lg p-3"
              >
                <p className="text-xs text-accentWarm mb-3">Delete this comment? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-1 text-xs font-medium bg-surface border border-border rounded hover:bg-surface/80"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteComment({ variables: { id: comment._id } })}
                    className="flex-1 py-1 text-xs font-medium bg-accentWarm text-white rounded hover:bg-accentWarm/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-sm text-textSecondary whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
                {comment.updatedAt && comment.createdAt !== comment.updatedAt && (
                  <span className="text-[10px] text-textMuted font-mono block mt-1">(edited)</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
