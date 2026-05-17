"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Layers, 
  Zap, 
  KeyRound, 
  Users, 
  BookOpen, 
  ChevronRight 
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-accent" />,
      title: "Ownership Authorization",
      desc: "Robust token guards ensure authors have absolute control. Only the original creator of a post or comment can edit or delete their content.",
    },
    {
      icon: <Layers className="w-6 h-6 text-accent" />,
      title: "Offset-Based Pagination",
      desc: "An engineered, generic pagination framework delivering metadata parameters like totalCount,totalPages, hasNextPage, and limit seamlessly.",
    },
    {
      icon: <KeyRound className="w-6 h-6 text-accent" />,
      title: "Silent Token Refresh",
      desc: "High-grade security loop exchanging access tokens dynamically using encrypted HTTP refresh cycles, preserving state-of-the-art session stability.",
    },
    {
      icon: <Zap className="w-6 h-6 text-accent" />,
      title: "Automated Counter Sync",
      desc: "Synchronized counter loops. Creating or removing comments automatically updates post comment metrics atomically.",
    },
  ];

  const techStack = [
    { name: "Next.js 14", category: "Frontend Framework", icon: <Cpu className="w-5 h-5 text-accentWarm" /> },
    { name: "NestJS", category: "Enterprise Backend", icon: <Cpu className="w-5 h-5 text-accentWarm" /> },
    { name: "GraphQL & Apollo", category: "API Query Language", icon: <Layers className="w-5 h-5 text-accentWarm" /> },
    { name: "MongoDB & Mongoose", category: "Data Storage", icon: <Database className="w-5 h-5 text-accentWarm" /> },
  ];

  return (
    <div className="col-span-12 max-w-5xl mx-auto w-full pt-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-16"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-4 bg-gradient-to-r from-textPrimary via-textSecondary to-accentWarm bg-clip-text text-transparent">
            The Engine Behind Premium Blog
          </h1>
          <p className="text-lg md:text-xl text-textSecondary leading-relaxed">
            A state-of-the-art content management platform constructed with modular components, secure validation models, and a blazing fast API.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/"
              className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-full font-medium transition-all flex items-center gap-2"
            >
              Explore Feed <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="text-center">
            <h2 className="text-xs font-mono font-bold text-textSecondary uppercase tracking-widest mb-2">
              Architectural Design
            </h2>
            <h3 className="text-3xl font-display font-bold">Engineered Core Capabilities</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="glass-panel p-8 rounded-2xl border border-border/50 hover:border-accent/30 transition-all duration-300 flex gap-5"
              >
                <div className="shrink-0 p-3 rounded-xl bg-surface/50 border border-border/30 h-fit">
                  {feat.icon}
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-lg text-textPrimary">{feat.title}</h4>
                  <p className="text-sm text-textSecondary leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack & Developer details */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 glass-panel p-8 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-textSecondary uppercase tracking-widest">
                Our Technology Ecosystem
              </h4>
              <h3 className="text-2xl font-display font-bold text-textPrimary">
                Built with Enterprise-Grade Core Abstractions
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed">
                By decoupling our storage engines from presentation layers using type-safe GraphQL interfaces, this platform guarantees microsecond performance, modular reusability, and infinite schema scaling.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              {techStack.map((tech, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface/40 border border-border/30 flex items-center gap-3">
                  <div className="shrink-0">{tech.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-textPrimary">{tech.name}</div>
                    <div className="text-xs text-textMuted font-mono">{tech.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 glass-panel p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl rounded-full pointer-events-none" />
            <div className="space-y-6 z-10">
              <h4 className="text-xs font-mono font-bold text-textSecondary uppercase tracking-widest">
                System Verification
              </h4>
              <h3 className="text-2xl font-display font-bold text-textPrimary">
                Production-Ready & Fully Observable
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-mono text-textSecondary">GraphQL Server: Online</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-mono text-textSecondary">MongoDB Connection: Stable</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-mono text-textSecondary">Validation Pipes: Activated</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border/30 mt-8 font-mono text-xs text-textSecondary">
              Designed & developed for extreme performance, type safety, and premium aesthetics.
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
