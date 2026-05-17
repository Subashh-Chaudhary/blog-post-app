"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client/react";
import { REGISTER_MUTATION } from "@/lib/graphql/documents";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Check, X } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Must contain uppercase, lowercase, and a number"
    )
    .min(8, "Must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  const rules = [
    { label: "8+ characters", test: (val: string) => val.length >= 8 },
    { label: "Uppercase letter", test: (val: string) => /[A-Z]/.test(val) },
    { label: "Lowercase letter", test: (val: string) => /[a-z]/.test(val) },
    { label: "Number", test: (val: string) => /\d/.test(val) },
  ];

  const strengthScore = rules.filter((rule) => rule.test(passwordValue)).length;

  const [registerMutation] = useMutation(REGISTER_MUTATION);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const { data: result } = await registerMutation({
        variables: { dto: data },
      });

      const authData = (result as any).register;
      
      await fetch("/api/auth/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: authData.refreshToken }),
      });

      setAuth(authData.accessToken, authData.user);
      setSuccess(true);
      addToast("Account created successfully!", "success");
      
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      addToast(err.message || "Registration failed", "error");
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
            Start writing your next masterpiece.
          </h2>
          <p className="text-textSecondary font-mono text-sm max-w-sm">
            Join a community of forward-thinking creators building the web of tomorrow.
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
            className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto"
          >
            <div className="w-full max-w-md glass-panel p-8 sm:p-12 rounded-2xl relative my-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-display font-bold mb-2">Create Account</h1>
                <p className="text-textSecondary text-sm">Sign up to join the platform.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative group">
                  <input
                    {...register("fullName")}
                    type="text"
                    id="fullName"
                    placeholder=" "
                    className={clsx(
                      "block w-full bg-surface/50 border border-border rounded-lg px-4 pt-6 pb-2 text-textPrimary appearance-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accentGlow transition-all peer",
                      errors.fullName && "border-accentWarm focus:border-accentWarm focus:ring-accentWarm/30"
                    )}
                  />
                  <label
                    htmlFor="fullName"
                    className={clsx(
                      "absolute text-sm text-textSecondary duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none",
                      errors.fullName && "text-accentWarm"
                    )}
                  >
                    Full Name
                  </label>
                  {errors.fullName && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-accentWarm text-xs mt-2 font-mono">
                      {errors.fullName.message}
                    </motion.p>
                  )}
                </div>

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
                  
                  {/* Live Password Strength Meter */}
                  <div className="mt-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={clsx("h-1 flex-1 rounded-full transition-colors duration-300", {
                            "bg-border": strengthScore <= i,
                            "bg-accentWarm": strengthScore > i && strengthScore <= 2,
                            "bg-accentGold": strengthScore > i && strengthScore === 3,
                            "bg-accent": strengthScore > i && strengthScore === 4,
                          })}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {rules.map((rule, idx) => {
                        const passed = rule.test(passwordValue);
                        return (
                          <div key={idx} className="flex items-center gap-1.5 text-xs font-mono">
                            {passed ? (
                              <Check className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-textMuted" />
                            )}
                            <span className={passed ? "text-textPrimary" : "text-textMuted"}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || strengthScore < 4}
                  className="w-full h-12 mt-4 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
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
                        Create Account
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-textSecondary">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
