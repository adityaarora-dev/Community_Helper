import React from 'react';
import { ArrowRight, ArrowUpRight, Sprout, House, HeartHandshake, GraduationCap } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function HomeView({ onNavigate, user }) {
  const { t } = useLanguage();
  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-rule" />{t('eyebrow')}</p><h1>{t('heroTitle')}<br /><em>{t('heroAccent')}</em></h1><p className="hero-description">{t('heroBody')}</p><div className="hero-actions"><button className="button button-primary button-large" onClick={() => onNavigate(user ? '/citizen/intake' : 'register')}>{t('getStarted')}<ArrowUpRight size={19} /></button><button className="text-link" onClick={() => onNavigate('/allschemes')}>{t('browse')}<ArrowRight size={17} /></button></div><p className="quiet-note">{t('freeNote')}</p></div>
      <aside className="next-step-panel" aria-labelledby="next-step-title">
        <p className="eyebrow">{t('nextSteps')}</p>
        <h2 id="next-step-title">{t('startHere')}</h2>
        {[
          ['01', 'profile', 'step1Body', user ? '/citizen/intake' : 'register'],
          ['02', 'assistant', 'step2Body', user ? '/chat/ai' : 'login'],
          ['03', 'centers', 'step3Body', '/servicecenters'],
        ].map(([number, title, description, target]) => (
          <button className="next-step" key={number} onClick={() => onNavigate(target)}>
            <span className="next-step-number">{number}</span>
            <span><strong>{t(title)}</strong><span className="next-step-description">{t(description)}</span></span>
            <ArrowUpRight size={19} />
          </button>
        ))}
      </aside>
    </section>
    <div className="category-strip">{[[Sprout, 'agriculture'], [House, 'housing'], [HeartHandshake, 'healthcare'], [GraduationCap, 'education']].map(([Icon, key]) => <button key={key} onClick={() => onNavigate('/allschemes', key.charAt(0).toUpperCase() + key.slice(1))}><Icon size={21} strokeWidth={1.3} />{t(key)}<ArrowUpRight size={15} /></button>)}</div>
    <section className="steps-section"><div className="section-intro"><p className="eyebrow">{t('journey')}</p><h2>{t('how')}</h2></div><div className="steps-grid">{[1, 2, 3].map((n) => <article key={n}><span className="step-number">0{n}</span><h3>{t('step' + n)}</h3><p>{t('step' + n + 'Body')}</p></article>)}</div></section>
    <section className="help-banner"><div><p className="eyebrow">{t('centers')}</p><h2>{t('together')}</h2><p>{t('centersBody')}</p></div><button className="button button-light" onClick={() => onNavigate('/servicecenters')}>{t('centers')}<ArrowUpRight size={18} /></button></section>
  </div>;
}
