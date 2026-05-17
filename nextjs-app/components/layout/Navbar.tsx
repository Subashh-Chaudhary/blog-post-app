"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useApolloClient } from "@apollo/client/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, FileText } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const client = useApolloClient();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/cookie", { method: "DELETE" });
    clearAuth();
    client.clearStore();
    setDropdownOpen(false);
    router.push("/");
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
        {
          "backdrop-blur-xl bg-background/80 border-border/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]":
            scrolled,
        }
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight flex items-center gap-2"
        >
          <span className="text-accent">∎</span> Pencraft
        </Link>

        <div>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-surfaceGlass border border-transparent hover:border-border transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-mono text-sm font-bold">
                  {userInitials}
                </div>
                <ChevronDown className="w-4 h-4 text-textSecondary" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 glass-panel rounded-xl overflow-hidden shadow-2xl py-2 flex flex-col"
                  >
                    <div className="px-4 py-2 border-b border-border/50 mb-2">
                      <p className="text-sm font-medium truncate">{user.fullName}</p>
                      <p className="text-xs text-textSecondary font-mono truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <Link
                      href="/posts/new"
                      className="px-4 py-2 text-sm hover:bg-surfaceGlass flex items-center gap-3 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FileText className="w-4 h-4 text-textSecondary" />
                      New Post
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm text-left hover:bg-surfaceGlass flex items-center gap-3 transition-colors text-accentWarm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-full transition-transform hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
