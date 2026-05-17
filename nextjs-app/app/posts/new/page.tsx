"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client/react";
import { CREATE_POST_MUTATION, GET_POSTS_QUERY } from "@/lib/graphql/documents";
import { useToastStore } from "@/lib/store/useToastStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
  });

  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    refetchQueries: [
      {
        query: GET_POSTS_QUERY,
        variables: { paginationInput: { page: 1, limit: 10 } }
      }
    ]
  });

  const onSubmit = async (data: PostFormValues) => {
    try {
      const { data: result } = await createPost({
        variables: { input: { ...data, published: true } },
      });
      addToast("Post created successfully!", "success");
      router.push(`/posts/${(result as any).createPost._id}`);
    } catch (err: any) {
      addToast(err.message || "Failed to create post", "error");
    }
  };

  if (!user) {
    return (
      <div className="col-span-12 py-32 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-display font-bold mb-4">Access Denied</h2>
        <p className="text-textSecondary mb-8 max-w-md">
          You need to be signed in to create a new post.
        </p>
        <Link href="/login" className="px-6 py-2 rounded-full bg-accent text-white font-medium hover:bg-accent/90 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="col-span-12 max-w-4xl mx-auto w-full pt-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-mono text-textSecondary hover:text-accent transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 rounded-2xl"
      >
        <h1 className="text-4xl font-display font-bold mb-8">Create New Post</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="relative group">
            <input
              {...register("title")}
              type="text"
              id="title"
              placeholder=" "
              className={clsx(
                "block w-full bg-surface/50 border border-border rounded-xl px-5 pt-8 pb-3 text-2xl font-display font-bold text-textPrimary appearance-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accentGlow transition-all peer",
                errors.title && "border-accentWarm focus:border-accentWarm focus:ring-accentWarm/30"
              )}
            />
            <label
              htmlFor="title"
              className={clsx(
                "absolute text-sm text-textSecondary duration-150 transform -translate-y-3 scale-75 top-5 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none",
                errors.title && "text-accentWarm"
              )}
            >
              Post Title
            </label>
            {errors.title && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-accentWarm text-xs mt-2 font-mono ml-2">
                {errors.title.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-mono text-textSecondary ml-2 block">
              Content (Markdown supported)
            </label>
            <textarea
              {...register("content")}
              id="content"
              rows={15}
              className={clsx(
                "w-full bg-surface/50 border border-border rounded-xl p-5 text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accentGlow transition-all font-mono text-sm leading-relaxed",
                errors.content && "border-accentWarm focus:border-accentWarm focus:ring-accentWarm/30"
              )}
              placeholder="Write your story here..."
            />
            {errors.content && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-accentWarm text-xs font-mono ml-2">
                {errors.content.message}
              </motion.p>
            )}
          </div>

          <div className="flex justify-end border-t border-border/50 pt-8 mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Publish Post
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
