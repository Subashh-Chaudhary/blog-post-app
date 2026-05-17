"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/lib/store/useToastStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import clsx from "clsx";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={clsx(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px]",
              {
                "bg-surfaceGlass border-accent/20": toast.type === "success",
                "bg-surfaceGlass border-accentWarm/30": toast.type === "error",
                "bg-surfaceGlass border-border": toast.type === "info",
              }
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-accent" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-accentWarm" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-accentGold" />}
            </div>
            
            <p className="flex-1 text-sm font-medium text-textPrimary leading-relaxed">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
