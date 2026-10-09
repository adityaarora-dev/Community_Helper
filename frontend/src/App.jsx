import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat_ai' | 'intake' | 'schemes' | 'centers' | 'login'
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('English');

  // Load existing session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('civic_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('civic_user');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('civic_auth_token');
    localStorage.removeItem('civic_user');
    setUser(null);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />

        <Dashboard
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onAuthSuccess={handleAuthSuccess}
          language={language}
        />
      </div>

      <footer className="mt-16 border-t border-emerald-500/10 bg-slate-950/90 py-8 text-center text-xs text-slate-500 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <p className="font-semibold text-slate-400">
              CivicHelper AI &bull; Intelligent Community Resource & Welfare Matcher
            </p>
          </div>
          <p className="font-mono text-[11px] text-slate-500">
            PostgreSQL Session Pooler (5432) &bull; React + Tailwind v4 &bull; Google GenAI Multilingual
          </p>
        </div>
      </footer>
    </div>
  );
}
