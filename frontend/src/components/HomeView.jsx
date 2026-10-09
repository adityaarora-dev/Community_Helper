import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  Users,
  IndianRupee,
  Layers,
  FileCheck,
  Building2,
  MapPin,
  Bot,
  Zap,
  Globe2,
  Lock,
  MailCheck,
} from 'lucide-react';

export default function HomeView({
  onNavigate,
  onQuickLogin,
  user,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16"
    >
      {/* Hero Section */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-950 p-8 md:p-14 backdrop-blur-2xl shadow-2xl shadow-emerald-950/30 text-center"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Civic Welfare & Resource Engine
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
            <MailCheck className="h-3.5 w-3.5" />
            Brevo OTP Verified Authentication
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-300">
            <Globe2 className="h-3.5 w-3.5 text-teal-400" />
            Multilingual via Gemini
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight">
          Intelligent Community Resource &{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            Welfare Scheme Matcher
          </span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Empowering citizens through deterministic relational PostgreSQL filtering and Google Gemini AI.
          Create an account with email OTP verification to unlock your personalized eligibility engine.
        </p>

        {/* Auth CTA Banner if not logged in */}
        {!user ? (
          <div className="mt-8 mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
            <p className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Authentication & Authorization Required</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Please sign in or create an account to unlock <code className="text-emerald-400">/citizen/intake</code> and <code className="text-teal-300">/chat/ai</code>.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110 active:scale-95"
              >
                <span>Login / Create Account (OTP)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
            <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Authorized Citizen: {user.name}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Full access unlocked to Citizen Intake, Chat AI Assistant, and Scheme Catalog.
            </p>
          </div>
        )}

        {/* Hero Router CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate(user ? '/chat/ai' : 'login')}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:brightness-110 active:scale-95"
          >
            <Bot className="h-4 w-4" />
            <span>Launch /chat/ai</span>
            {!user && <Lock className="h-3.5 w-3.5 text-amber-300" />}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onNavigate(user ? '/citizen/intake' : 'login')}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white hover:border-emerald-500/40"
          >
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span>Citizen /citizen/intake</span>
            {!user && <Lock className="h-3.5 w-3.5 text-amber-300" />}
          </button>

          <button
            onClick={() => onNavigate('/allschemes')}
            className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <Building2 className="h-4 w-4 text-teal-400" />
            <span>Browse /allschemes</span>
          </button>
        </div>
      </motion.div>

      {/* Demo Credentials Quick-Launch Showcase */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant Test Citizen Profiles</span>
            </h2>
            <p className="text-xs text-slate-400">
              One-click simulation with verified pre-seeded profiles in Supabase PostgreSQL
            </p>
          </div>
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
          >
            <span>Open Dedicated Login Page</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Ramesh Kumar */}
          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-emerald-500/40 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                  RK
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ramesh Kumar</h3>
                  <p className="text-xs text-slate-400 font-mono">citizen@example.com</p>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Farmer &bull; North Zone
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Income</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">₹1,80,000</p>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Family</p>
                <p className="text-xs font-bold text-slate-200 font-mono">3 Members</p>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Land</p>
                <p className="text-xs font-bold text-amber-400 font-mono">2.0 Acres</p>
              </div>
            </div>

            <button
              onClick={() => onQuickLogin('citizen@example.com', 'Citizen@123')}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 py-2.5 text-xs font-bold text-white transition active:scale-95"
            >
              <span>Quick Login as Ramesh Kumar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 2: Sunita Devi */}
          <div className="rounded-3xl border border-amber-500/20 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-amber-500/40 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
                  SD
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sunita Devi</h3>
                  <p className="text-xs text-slate-400 font-mono">vendor@example.com</p>
                </div>
              </div>
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                Street Vendor &bull; Central Zone
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Income</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">₹1,20,000</p>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Family</p>
                <p className="text-xs font-bold text-slate-200 font-mono">4 Members</p>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase">Occupation</p>
                <p className="text-xs font-bold text-teal-400 font-mono">Vendor</p>
              </div>
            </div>

            <button
              onClick={() => onQuickLogin('vendor@example.com', 'Citizen@123')}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 py-2.5 text-xs font-bold text-white transition active:scale-95"
            >
              <span>Quick Login as Sunita Devi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Feature Pillar Highlights */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">/chat/ai Assistant</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Multi-turn contextual reasoning extracting 9 demographic parameters in English, Hindi, and regional tongues.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <FileCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">/citizen/intake Form</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Direct parameter intake for annual income, family size, zone, and disability status saved to PostgreSQL.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">/allschemes Catalog</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            All 7 codified welfare schemes, eligibility rules, and documentation checklists in one directory.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">/servicecenters Hubs</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Municipal Seva Kendras with phone numbers, hours, and navigation directions.
          </p>
        </div>
      </motion.div>

      {/* Metrics Banner */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">7 Active</p>
            <p className="mt-1 text-xs text-slate-400">Codified Welfare Schemes</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">5 Zones</p>
            <p className="mt-1 text-xs text-slate-400">Facilitation Centers</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">₹5,00,000</p>
            <p className="mt-1 text-xs text-slate-400">Max Citizen Benefit</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100%</p>
            <p className="mt-1 text-xs text-slate-400">Zero-Hallucination Precision</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
