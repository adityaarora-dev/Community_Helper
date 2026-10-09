import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { loginUser, sendRegistrationOtp, verifyOtpAndRegister } from '../services/api';
import { useLanguage } from '../i18n';
import { startSession } from '../services/authSession';
import { ZONES } from './DemographicFields';

export default function LoginView({ onAuthSuccess, onNavigateToHome, initialMode = 'login' }) {
  const { t, label } = useLanguage();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '', location_zone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setMode(initialMode); setStep(1); setError(''); }, [initialMode]);
  const changeMode = (value) => { setMode(value); setStep(1); setError(''); };
  const submit = async (e) => {
    e.preventDefault(); if (loading) return;
    setLoading(true); setError('');
    try {
      if (mode === 'register' && step === 1) { await sendRegistrationOtp({ name: form.name, email: form.email, password: form.password, demographics: { location_zone: form.location_zone } }); setStep(2); }
      else {
        const data = mode === 'login' ? await loginUser({ email: form.email, password: form.password }) : await verifyOtpAndRegister({ email: form.email, otp: form.otp });
        startSession(data.token); onAuthSuccess(data.user, { isNewAccount: mode === 'register' });
      }
    } catch { setError(mode === 'login' ? 'loginError' : step === 2 ? 'otpError' : 'otpSendError'); }
    finally { setLoading(false); }
  };
  const field = (key, label, type = 'text', autoComplete) => <label className="field">{t(label)}<input name={key} type={type} autoComplete={autoComplete} value={form[key]} required disabled={loading} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>;
  return <section className="auth-layout">
    <aside className="auth-aside"><p className="eyebrow">CIVICHELPER</p><h1>{t('heroTitle')}<br /><em>{t('heroAccent')}</em></h1><p>{t('authBody')}</p><div className="auth-arch" aria-hidden="true" /></aside>
    <div className="auth-form-wrap"><button className="text-link" onClick={onNavigateToHome}><ArrowLeft size={16} />{t('home')}</button><div className="segmented-control"><button disabled={loading} className={mode === 'login' ? 'selected' : ''} onClick={() => changeMode('login')}>{t('signIn')}</button><button disabled={loading} className={mode === 'register' ? 'selected' : ''} onClick={() => changeMode('register')}>{t('signUp')}</button></div><h2>{mode === 'login' ? t('welcome') : step === 1 ? t('signUp') : t('code')}</h2><p className="muted">{step === 2 ? t('codeSent') : mode === 'register' ? t('authBody') : t('signInNote')}</p>
      <form onSubmit={submit} className="form-stack"><fieldset disabled={loading} className="form-stack">{step === 2 && mode === 'register' ? <><p className="email-notice"><Mail size={18} />{form.email}</p><label className="field">{t('code')}<input name="otp" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="otp-input" /></label><button type="button" className="text-link" onClick={() => { setStep(1); setError(''); }}>{t('changeDetails')}</button></> : <>{mode === 'register' && field('name', 'fullName', 'text', 'name')}{field('email', 'email', 'email', 'email')}{field('password', 'password', 'password', mode === 'login' ? 'current-password' : 'new-password')}</>}
      {mode === 'register' && step === 1 && <label className="field">{t('zone')}<select name="location_zone" required value={form.location_zone} onChange={(e) => setForm({ ...form, location_zone: e.target.value })}><option value="">{t('choose')}</option>{ZONES.map((zone) => <option key={zone} value={zone}>{label(zone)}</option>)}</select><span className="muted">{t('zoneAlertsHint')}</span></label>}
      {error && <p className="notice notice-error" role="alert">{t(error)}</p>}<button className="button button-primary full-width" type="submit">{loading ? t('loading') : mode === 'login' ? t('signIn') : step === 1 ? t('sendCode') : t('verify')}<ArrowRight size={18} /></button></fieldset></form>
      {mode === 'login' && <label className="field demo-select">{t('demo')}<select defaultValue="" disabled={loading} onChange={(e) => { if (e.target.value) setForm({ ...form, email: e.target.value, password: 'Citizen@123' }); }}><option value="">{t('choose')}</option><option value="citizen@example.com">Ramesh Kumar — {t('farmer')}</option><option value="vendor@example.com">Sunita Devi — {t('vendor')}</option></select></label>}
    </div>
  </section>;
}
