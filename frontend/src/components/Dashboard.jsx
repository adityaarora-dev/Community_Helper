import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import HomeView from './HomeView';
import LoginView from './LoginView';
import NotificationsView from './NotificationsView';
import ProfileIntakeView from './ProfileIntakeView';
import SchemeCatalogView from './SchemeCatalogView';
import ServiceCentersView from './ServiceCentersView';
import StructuredFilterPanel from './StructuredFilterPanel';
import ChatInterface from './ChatInterface';
import SchemeCard from './SchemeCard';
import { EMPTY_DEMOGRAPHICS } from './DemographicFields';
import { sendChatMessage } from '../services/api';
import { useLanguage } from '../i18n';

export default function Dashboard({ activeTab, setActiveTab, user, onAuthSuccess, language, authMode, catalogCategory, inbox }) {
  const { t } = useLanguage();
  const [demographics, setDemographics] = useState(EMPTY_DEMOGRAPHICS);
  const [messages, setMessages] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const previousUser = useRef(null);
  useEffect(() => {
    const next = { ...EMPTY_DEMOGRAPHICS };
    if (user) Object.keys(next).forEach((key) => { if (user[key] != null) next[key] = user[key]; });
    setDemographics(next);
    if (previousUser.current !== user?.user_id) {
      requestId.current += 1; setMessages([]); setSchemes([]); setHasSearched(false); setError(false); setIsLoading(false);
    }
    previousUser.current = user?.user_id;
  }, [user]);
  const runMatch = async (text, profileDetails = demographics) => {
    if (isLoading) return;
    const id = ++requestId.current;
    setIsLoading(true); setError(false);
    if (text) setMessages((prev) => [...prev, { role: 'user', content: text }]);
    const known = Object.fromEntries(Object.keys({ ...EMPTY_DEMOGRAPHICS, category: null })
      .filter((key) => profileDetails[key] !== '' && profileDetails[key] !== null && profileDetails[key] !== undefined)
      .map((key) => [key, profileDetails[key]]));

    try {
      const chatHistory = messages.filter((m) => !m.error).map((m) => ({
        role: m.role,
        content: m.content,
        sql: m.sql || undefined,
      }));
      const result = await sendChatMessage({
        ...(text ? { query: text } : {}),
        demographics: known,
        history: chatHistory,
        userId: user?.user_id,
        language,
      });
      if (id !== requestId.current) return;
      setSchemes(result.schemes || []); setHasSearched(true);
      if (result.extracted_params) setDemographics((prev) => ({ ...prev, ...result.extracted_params }));
      if (text) setMessages((prev) => [...prev, {
        role: 'assistant',
        content: result.conversational_reply || result.summary,
        matchedCount: result.matched_count,
        sql: result.sql,
        thought: result.thought,
        explanation: result.explanation,
        executionTimeMs: result.execution_time_ms,
        rowCount: result.row_count,
        columns: result.columns,
        rows: result.rows,
      }]);
      setActiveTab('/chat/ai');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(true);
      const errMsg = err.response?.data?.message || err.message || 'Error processing request';
      const errorType = err.response?.data?.error_type;
      const attemptedSql = err.response?.data?.attempted_sql;
      if (text) setMessages((prev) => [...prev, {
        role: 'assistant',
        error: true,
        content: errMsg,
        errorType,
        attemptedSql,
      }]);
    } finally { if (id === requestId.current) setIsLoading(false); }
  };
  const guard = <section className="auth-guard panel"><p className="eyebrow">{t('profile')}</p><h1>{t('getStarted')}</h1><p>{t('signInNote')}</p><div className="form-actions"><button className="button button-primary" onClick={() => setActiveTab('register')}>{t('signUp')}<ArrowRight size={17} /></button><button className="button button-outline" onClick={() => setActiveTab('login')}>{t('signIn')}</button></div></section>;
  return <main id="main-content" tabIndex="-1">
    {activeTab === '/notifications' && user && <NotificationsView key={user.user_id} inbox={inbox} user={user} onProfile={() => setActiveTab('/citizen/intake')} />}
    {activeTab === 'home' && <HomeView onNavigate={setActiveTab} user={user} />}
    {activeTab === 'login' && <LoginView initialMode={authMode} onAuthSuccess={(value, { isNewAccount } = {}) => { onAuthSuccess(value); setActiveTab(isNewAccount ? '/chat/ai' : '/citizen/intake'); }} onNavigateToHome={() => setActiveTab('home')} />}
    {activeTab === '/allschemes' && <SchemeCatalogView initialCategory={catalogCategory} />}
    {activeTab === '/servicecenters' && <ServiceCentersView defaultZone={demographics.location_zone || 'All Zones'} />}
    {(activeTab === '/citizen/intake' || activeTab === '/chat/ai') && !user && guard}
    {error && user && (activeTab === '/citizen/intake' || activeTab === '/chat/ai') && <p className="notice notice-error content-error" role="alert">{t('error')}</p>}
    {activeTab === '/citizen/intake' && user && <ProfileIntakeView key={user.user_id} onRunMatch={(saved) => runMatch(undefined, saved)} user={user} onProfileSaved={onAuthSuccess} isLoading={isLoading} />}
    {activeTab === '/chat/ai' && user && <section className="content-page"><div className="page-heading"><p className="eyebrow">{t('assistant')}</p><h1>{t('how')}</h1></div><div className="assistant-layout"><StructuredFilterPanel demographics={demographics} onChange={setDemographics} onApply={() => runMatch()} onReset={() => setDemographics({ ...EMPTY_DEMOGRAPHICS })} isLoading={isLoading} /><div className="assistant-main"><ChatInterface messages={messages} onSendMessage={runMatch} isLoading={isLoading} onSwitchToIntake={() => setActiveTab('/citizen/intake')} /><div className="results-heading"><h2>{t('matches')}{hasSearched ? ' (' + schemes.length + ')' : ''}</h2><p>{t('matchesNote')}</p></div>{language !== 'English' && schemes.length > 0 && <p className="source-note">{t('sourceNote')}</p>}{isLoading ? <p className="empty-state" role="status">{t('loading')}</p> : schemes.length ? <div className="results-grid">{schemes.map((scheme) => <SchemeCard key={scheme.scheme_id} scheme={scheme} />)}</div> : <p className="empty-state">{t(hasSearched ? 'noResults' : 'emptyMatches')}</p>}</div></div></section>}
  </main>;
}
