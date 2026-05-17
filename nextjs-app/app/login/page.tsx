"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { LOGIN_MUTATION } from "@/lib/graphql/documents";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const client = useApolloClient();
  const [loginMutation] = useMutation(LOGIN_MUTATION);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { data: result } = await loginMutation({
        variables: { dto: data },
      });

      const authData = (result as any).login;
      
      // Store token in HTTP-only cookie via API route
      await fetch("/api/auth/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: authData.refreshToken }),
      });

      setAuth(authData.accessToken, authData.user);
      
      // Clear the Apollo cache without immediately re-running active queries.
      // resetStore() would re-fire all queries before React has committed the
      // new auth state, risking a 401 race. clearStore() is safe here.
      try {
        await client.clearStore();
      } catch {
        // Silently ignore — cache clear failure is non-critical.
      }

      setSuccess(true);
      addToast("Welcome back!", "success");
      
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      addToast(err.message || "Invalid credentials", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-background">
      {/* Decorative Left Panel */}
      <div className="hidden lg:flex w-2/5 relative overflow-hidden bg-surface flex-col justify-between p-12 border-r border-border/50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-accent/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-accentWarm/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="font-display text-3xl font-bold flex items-center gap-2">
            <span className="text-accent">∎</span> Pencraft
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-5xl leading-tight">
            The premium platform for developers & creators.
          </h2>
          <p className="text-textSecondary font-mono text-sm max-w-sm">
            Join the conversation. Write, read, and share ideas that matter.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <AnimatePresence>
        {!success && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex items-center justify-center p-6 lg:p-12 relative"
          >
            <div className="w-full max-w-md glass-panel p-8 sm:p-12 rounded-2xl relative">
              <div className="mb-10">
                <h1 className="text-3xl font-display font-bold mb-2">Welcome Back</h1>
                <p className="text-textSecondary text-sm">Sign in to continue to your account.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="relative group">
                  <input
                    {...register("email")}
                    type="email"
                    id="email"
                    placeholder=" "
                    className={clsx(
                      "block w-full bg-surface/50 border border-border rounded-lg px-4 pt-6 pb-2 text-textPrimary appearance-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accentGlow transition-all peer",
                      errors.email && "border-accentWarm focus:border-accentWarm focus:ring-accentWarm/30"
                    )}
                  />
                  <label
                    htmlFor="email"
                    className={clsx(
                      "absolute text-sm text-textSecondary duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none",
                      errors.email && "text-accentWarm"
                    )}
                  >
                    Email address
                  </label>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-accentWarm text-xs mt-2 font-mono">
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                <div className="relative group">
                  <input
                    {...register("password")}
                    type="password"
                    id="password"
                    placeholder=" "
                    className={clsx(
                      "block w-full bg-surface/50 border border-border rounded-lg px-4 pt-6 pb-2 text-textPrimary appearance-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accentGlow transition-all peer",
                      errors.password && "border-accentWarm focus:border-accentWarm focus:ring-accentWarm/30"
                    )}
                  />
                  <label
                    htmlFor="password"
                    className={clsx(
                      "absolute text-sm text-textSecondary duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none",
                      errors.password && "text-accentWarm"
                    )}
                  >
                    Password
                  </label>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-accentWarm text-xs mt-2 font-mono">
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-70 flex items-center justify-center relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-textSecondary">
                Don't have an account?{" "}
                <Link href="/register" className="text-accent hover:underline font-medium transition-colors">
                  Create one now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
