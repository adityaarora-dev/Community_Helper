import React, { useEffect, useState } from 'react';
import { clearSession, getSessionToken, touchSession } from './services/authSession';
import { logoutUser, keepSessionActive } from './services/api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AdminView from './components/AdminView';
import useNotifications from './services/useNotifications';
import { LanguageProvider, useLanguage } from './i18n';

function Portal() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [user, setUser] = useState(null);
  useEffect(() => { clearSession(); }, []);
  useEffect(() => {
    const ended = () => { setUser(null); setActiveTab('login'); };
    window.addEventListener('civic-session-ended', ended);
    if (!user) return () => window.removeEventListener('civic-session-ended', ended);
    let lastPing = 0;
    const activity = (event) => {
      if (!event.isTrusted || !getSessionToken()) return;
      touchSession();
      if (Date.now() - lastPing > 60000) {
        lastPing = Date.now(); keepSessionActive().catch(() => {});
      }
    };
    const check = () => { getSessionToken(); };
    const timer = setInterval(check, 15000);
    window.addEventListener('pointerdown', activity);
    window.addEventListener('keydown', activity);
    window.addEventListener('scroll', activity, true);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('civic-session-ended', ended);
      window.removeEventListener('pointerdown', activity);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('scroll', activity, true);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
    };
  }, [user?.user_id]);
  const navigate = (tab, category = '') => {
    if (tab === '/allschemes') setCatalogCategory(category);
    if (tab === 'register' || tab === 'login') { setAuthMode(tab === 'register' ? 'register' : 'login'); setActiveTab('login'); }
    else setActiveTab(tab);
  };
  const inbox = useNotifications(user);
  const logout = () => {
    // Capture the token before clearing it so logout can revoke this exact session.
    void logoutUser().catch(() => {});
    clearSession();
    setUser(null);
    setActiveTab('home');
  };
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">{t('skip')}</a>
    <Navbar activeTab={activeTab} setActiveTab={navigate} user={user} onLogout={logout} language={language} setLanguage={setLanguage} unreadCount={inbox.unreadCount} />
    <Dashboard activeTab={activeTab} setActiveTab={navigate} user={user} onAuthSuccess={setUser} language={language} authMode={authMode} catalogCategory={catalogCategory} inbox={inbox} />
    <footer className="site-footer"><span className="wordmark">CivicHelper<span className="brand-dot">.</span></span><p>{t('community')}</p><a href="/admin">Admin</a><span>© {new Date().getFullYear()} CivicHelper</span></footer>
  </div>;
}
export default function App() { return window.location.pathname.replace(/\/$/, '') === '/admin' ? <AdminView /> : <LanguageProvider><Portal /></LanguageProvider>; }
