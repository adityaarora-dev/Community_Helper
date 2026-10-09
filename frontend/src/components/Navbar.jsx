import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  MessageSquare,
  FileCheck,
  Building2,
  MapPin,
  User,
  LogOut,
  Globe,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { checkHealth } from '../services/api';

const LANGUAGES = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'Bengali', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'Marathi', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  language,
  setLanguage,
}) {
  const [dbStatus, setDbStatus] = useState('checking');
  const [poolCount, setPoolCount] = useState(null);
  const [langOpen, setLangOpen] = useState(false);

  const verifyConnection = async () => {
    try {
      setDbStatus('checking');
      const data = await checkHealth();
      if (data.status === 'success') {
        setDbStatus('connected');
        setPoolCount(data.database?.pool?.totalCount || 1);
      } else {
        setDbStatus('error');
      }
    } catch {
      setDbStatus('error');
    }
  };

  useEffect(() => {
    verifyConnection();
    const interval = setInterval(verifyConnection, 20000);
    return () => clearInterval(interval);
  }, []);

  // Standardized Router Routes matching user specification:
  // HOME -> AUTH/LOGIN -> /citizen/intake, /chat/ai, /servicecenters, /allschemes
  const NAV_ITEMS = [
    { id: 'home', path: '/', label: 'Home', icon: Home, requiresAuth: false },
    { id: '/chat/ai', path: '/chat/ai', label: 'Chat AI', icon: MessageSquare, requiresAuth: true },
    { id: '/citizen/intake', path: '/citizen/intake', label: 'Citizen Intake', icon: FileCheck, requiresAuth: true },
    { id: '/allschemes', path: '/allschemes', label: 'All Schemes', icon: Building2, requiresAuth: false },
    { id: '/servicecenters', path: '/servicecenters', label: 'Service Centers', icon: MapPin, requiresAuth: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-slate-950/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                Civic<span className="text-emerald-400">Helper</span> <span className="text-amber-400">AI</span>
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Community Resource Engine &bull; Supabase PostgreSQL
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.requiresAuth && !user && (
                  <Lock className="h-2.5 w-2.5 text-amber-400/80" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Language Selector, DB Status, Auth */}
        <div className="flex items-center gap-2.5">
          {/* Multilingual Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-white transition"
              title="Select Conversation Language"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {LANGUAGES.find((l) => l.code === language)?.label.split(' ')[0] || 'EN'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900 p-1 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Select Language
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                      language === l.code
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-xs">{l.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Supabase Status Indicator */}
          <button
            onClick={verifyConnection}
            title="Supabase PostgreSQL Pooler Health"
            className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">PostgreSQL:</span>
              {dbStatus === 'connected' ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              ) : dbStatus === 'checking' ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Checking
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Offline
                </span>
              )}
            </div>
          </button>

          {/* Citizen Auth Button / Profile Badge */}
          {user ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-slate-900/90 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[110px]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 hover:brightness-110'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Login / Create</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Strip */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950 px-2 py-1.5 overflow-x-auto no-scrollbar gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.requiresAuth && !user && (
                <Lock className="h-2 w-2 text-amber-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
