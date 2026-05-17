"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto px-6 py-8 border-t border-border/50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-2 items-center text-sm text-textMuted font-mono">
        <div className="flex gap-6">
          <Link href="/" className="hover:text-textPrimary transition-colors">
            Home
          </Link>
          <Link href="#" className="hover:text-textPrimary transition-colors">
            About
          </Link>
        </div>
        <div className="text-right">
          &copy; {new Date().getFullYear()} Premium Blog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
