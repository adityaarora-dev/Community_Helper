import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function ChatInterface({ messages, onSendMessage, isLoading, onSwitchToIntake }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const thread = useRef(null);
  useEffect(() => { if (thread.current) thread.current.scrollTop = thread.current.scrollHeight; }, [messages, isLoading]);
  return <section className="panel chat-panel"><div className="chat-header"><h2>{t('assistant')}</h2><button className="text-link" onClick={onSwitchToIntake}>{t('profile')}<ArrowRight size={15} /></button></div><div className="chat-thread" ref={thread} role="log" aria-live="polite" aria-label={t('assistant')}>
    <div className="message assistant-message"><span className="message-byline">CivicHelper</span><p>{t('chatWelcome')}</p></div>
    {messages.map((message, index) => <div className={'message ' + (message.role === 'user' ? 'user-message' : 'assistant-message')} key={index}>{message.role !== 'user' && <span className="message-byline">CivicHelper</span>}<p>{message.error ? t('error') : message.content}</p>{message.matchedCount !== undefined && <span className="message-meta">{t('matches')}: {message.matchedCount}</span>}</div>)}
    {isLoading && <p className="loading-line" role="status">{t('thinking')}</p>}
    </div><form className="chat-compose" onSubmit={(e) => { e.preventDefault(); if (input.trim() && !isLoading) { onSendMessage(input.trim()); setInput(''); } }}><label className="sr-only" htmlFor="chat-input">{t('chatPlaceholder')}</label><textarea id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('chatPlaceholder')} rows={2} disabled={isLoading} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} /><button className="button button-primary icon-button" disabled={isLoading || !input.trim()} aria-label={t('send')} type="submit"><ArrowUp size={22} /></button></form></section>;
}
