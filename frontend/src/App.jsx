import React, { useState } from 'react';
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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civic_user') || 'null'); } catch { return null; }
  });
  const navigate = (tab, category = '') => {
    if (tab === '/allschemes') setCatalogCategory(category);
    if (tab === 'register' || tab === 'login') { setAuthMode(tab === 'register' ? 'register' : 'login'); setActiveTab('login'); }
    else setActiveTab(tab);
  };
  const inbox = useNotifications(user);
  const logout = () => {
    localStorage.removeItem('civic_auth_token');
    localStorage.removeItem('civic_user');
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
