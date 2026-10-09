import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Send,
} from 'lucide-react';
import { loginUser, sendRegistrationOtp, verifyOtpAndRegister } from '../services/api';

const DEMO_CITIZENS = [
  {
    id: 'ramesh',
    name: 'Ramesh Kumar',
    email: 'citizen@example.com',
    password: 'Citizen@123',
    role: 'Farmer (North Zone)',
    desc: 'Income: ₹1,80,000 | Family: 3 | Land: 2.0 Acres',
  },
  {
    id: 'sunita',
    name: 'Sunita Devi',
    email: 'vendor@example.com',
    password: 'Citizen@123',
    role: 'Street Vendor (Central Zone)',
    desc: 'Income: ₹1,20,000 | Family: 4 | Vendor Credit',
  },
];

export default function LoginView({ onAuthSuccess, onNavigateToHome }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [regStep, setRegStep] = useState(1); // 1 = details, 2 = otp verification
  const [selectedDemo, setSelectedDemo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Handle dropdown selection to automatically fill the fields
  const handleSelectDemo = (e) => {
    const val = e.target.value;
    setSelectedDemo(val);
    const chosen = DEMO_CITIZENS.find((c) => c.id === val);
    if (chosen) {
      setEmail(chosen.email);
      setPassword(chosen.password);
      setError(null);
    }
  };

  // Step 1: Send OTP to Email via Brevo
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await sendRegistrationOtp({ name, email, password });
      if (data.status === 'success') {
        setSuccessMsg(`OTP sent to ${email}. Please check your inbox or spam folder.`);
        setRegStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP verification email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Insert credentials into database
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await verifyOtpAndRegister({ email, otp });
      if (data.status === 'success') {
        localStorage.setItem('civic_auth_token', data.token);
        localStorage.setItem('civic_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      if (data.status === 'success') {
        localStorage.setItem('civic_auth_token', data.token);
        localStorage.setItem('civic_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-xl px-4 py-8 space-y-6"
    >
      {/* Container Card */}
      <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-8 backdrop-blur-2xl shadow-2xl shadow-emerald-950/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login'
              ? 'Citizen Portal Login'
              : regStep === 1
              ? 'Create Verified Citizen Profile'
              : 'Email OTP Verification'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {mode === 'login'
              ? 'Authenticate to unlock personalized AI scheme matching and demographic controls'
              : regStep === 1
              ? 'We verify your email via Brevo OTP before creating credentials in our database'
              : `Enter the 6-digit OTP code delivered to ${email}`}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-950/80 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRegStep(1);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegStep(1);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Demo Credentials Auto-Fill Dropdown in Login Mode */}
        {mode === 'login' && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <label className="text-xs font-bold text-amber-300">
                Pre-Seeded Demo Citizen Accounts:
              </label>
            </div>
            <select
              value={selectedDemo}
              onChange={handleSelectDemo}
              className="w-full rounded-xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="">-- Choose Account to Auto-Fill Credentials --</option>
              {DEMO_CITIZENS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role}) &bull; {c.email}
                </option>
              ))}
            </select>

            {selectedDemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/90 border border-emerald-500/30 p-2.5 text-xs text-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    Auto-filled: <strong>{DEMO_CITIZENS.find((c) => c.id === selectedDemo)?.name}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Password: Citizen@123</span>
              </motion.div>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Mode 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Email Address (Login ID)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Database...</span>
              ) : (
                <>
                  <span>Sign In to Citizen Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode 2: REGISTER STEP 1 (Details -> Request Brevo OTP) */}
        {mode === 'register' && regStep === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Ramesh Kumar"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                A 6-digit OTP will be sent to this email via Brevo before creating credentials.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>Sending OTP via Brevo...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Verification OTP to Email</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode 2: REGISTER STEP 2 (Enter OTP -> Verify and Save) */}
        {mode === 'register' && regStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-xs text-slate-300">
                Enter the 6-digit verification code sent to:
              </p>
              <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{email}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-medium text-slate-300">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full rounded-2xl border border-emerald-500/40 bg-slate-950 py-3 text-center text-2xl font-mono font-bold tracking-widest text-emerald-400 placeholder-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1 text-center text-[11px] text-amber-400">
                ⏱️ Code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying & Creating Account in DB...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify OTP & Create Citizen Profile</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setRegStep(1)}
                className="text-slate-400 hover:text-white transition"
              >
                &larr; Change Email / Edit Details
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Resend OTP</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-6 text-center text-[11px] text-slate-500">
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Brevo Transactional Email Engine &bull; Port 2525 Render Bypass Active
          </span>
        </div>
      </div>
    </motion.div>
  );
}
