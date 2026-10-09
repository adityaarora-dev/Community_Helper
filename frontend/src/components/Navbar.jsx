import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Globe, Menu, X, LogOut, UserRound, Bell } from 'lucide-react';
import { useLanguage, languages } from '../i18n';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, language, setLanguage, unreadCount = 0 }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const account = useRef(null);
  const avatar = useRef(null);
  const accountMenu = useRef(null);
  const mobileToggle = useRef(null);
  const firstFocus = useRef(0);
  const items = [
    ['home', 'home'], ['/allschemes', 'schemes'], ['/chat/ai', 'assistant'],
    ['/citizen/intake', 'profile'], ['/servicecenters', 'centers'],
  ];
  const initials = (user?.name || user?.email || 'C').trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();

  const closeAccount = (restoreFocus = false) => {
    setAccountOpen(false);
    if (restoreFocus) avatar.current?.focus();
  };
  const go = (tab) => {
    setActiveTab(tab);
    setOpen(false);
    closeAccount();
  };

  useEffect(() => {
    setAccountOpen(false);
    setOpen(false);
  }, [activeTab, user?.user_id]);

  useEffect(() => {
    if (accountOpen) {
      const buttons = accountMenu.current?.querySelectorAll('[role="menuitem"]');
      buttons?.[firstFocus.current === -1 ? buttons.length - 1 : 0]?.focus();
    }
  }, [accountOpen]);

  useEffect(() => {
    if (!accountOpen && !open) return;
    const outside = (event) => {
      if (accountOpen && !account.current?.contains(event.target)) setAccountOpen(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      if (accountOpen) { setAccountOpen(false); avatar.current?.focus(); }
      else { setOpen(false); mobileToggle.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [accountOpen, open]);

  const menuKeys = (event) => {
    const buttons = Array.from(accountMenu.current.querySelectorAll('[role="menuitem"]'));
    const index = buttons.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) { event.preventDefault(); buttons[next].focus(); }
  };

  return (
    <header className="site-header">
      <div className="nav-main">
        <button className="wordmark brand-button" onClick={() => go('home')} aria-label="CivicHelper">
          CivicHelper<span className="brand-dot">.</span>
        </button>
        <nav className="desktop-nav" aria-label={t('menu')}>
          {items.map(([id, key]) => (
            <button key={id} className={'nav-link ' + (activeTab === id ? 'is-active' : '')}
              aria-current={activeTab === id ? 'page' : undefined} onClick={() => go(id)}>{t(key)}</button>
          ))}
        </nav>
        <div className="nav-actions">
          {user && <button className="notification-button icon-button" aria-label={`${t('notifications')}${unreadCount ? ` (${unreadCount} ${t('unread')})` : ''}`} aria-current={activeTab === '/notifications' ? 'page' : undefined} onClick={() => go('/notifications')}><Bell size={19} />{unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>}
          <label className="language-select">
            <Globe size={16} aria-hidden="true" /><span className="sr-only">{t('language')}</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          {user ? (
            <div className="account-control" ref={account} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false);
            }}>
              <button ref={avatar} className="avatar-button" aria-label={t('accountMenu')}
                aria-haspopup="menu" aria-expanded={accountOpen} aria-controls={accountOpen ? 'account-menu' : undefined}
                onClick={() => { firstFocus.current = 0; setOpen(false); setAccountOpen(!accountOpen); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault(); firstFocus.current = event.key === 'ArrowUp' ? -1 : 0;
                    setOpen(false); setAccountOpen(true);
                  }
                }}>{initials}</button>
              {accountOpen && (
                <div className="account-dropdown" id="account-menu" role="menu" aria-label={t('accountMenu')}
                  ref={accountMenu} onKeyDown={menuKeys}>
                  <div className="account-caption" role="presentation"><strong>{user.name}</strong><span>{user.email}</span></div>
                  <button role="menuitem" tabIndex={-1} onClick={() => { go('/citizen/intake'); avatar.current?.focus(); }}>
                    <UserRound size={17} />{t('profile')}
                  </button>
                  <div className="menu-divider" role="separator" />
                  <button role="menuitem" tabIndex={-1} onClick={() => { closeAccount(); setOpen(false); onLogout(); }}>
                    <LogOut size={17} />{t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="nav-link sign-in-link" onClick={() => go('login')}>{t('signIn')}</button>
              <button className="button button-primary account-button" onClick={() => go('register')}>
                {t('signUp')}<ArrowUpRight size={16} />
              </button>
            </>
          )}
          <button ref={mobileToggle} className="icon-button mobile-toggle" aria-label={t('menu')}
            aria-expanded={open} aria-controls="mobile-nav"
            onClick={() => { closeAccount(); setOpen(!open); }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label={t('menu')}>
          {items.map(([id, key]) => (
            <button key={id} className={'nav-link ' + (activeTab === id ? 'is-active' : '')}
              onClick={() => go(id)} aria-current={activeTab === id ? 'page' : undefined}>{t(key)}</button>
          ))}
          {!user && <button className="nav-link" onClick={() => go('login')}>{t('signIn')}</button>}
        </nav>
      )}
    </header>
  );
}
