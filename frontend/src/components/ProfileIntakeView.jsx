import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pencil, Save } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../services/api';
import { useLanguage } from '../i18n';
import DemographicFields, { EMPTY_DEMOGRAPHICS } from './DemographicFields';

function draftFrom(user) {
  const draft = { ...EMPTY_DEMOGRAPHICS, name: user.name || '' };
  Object.keys(EMPTY_DEMOGRAPHICS).forEach((key) => {
    if (user[key] !== null && user[key] !== undefined) draft[key] = user[key];
  });
  return draft;
}

export default function ProfileIntakeView({ onRunMatch, user, onProfileSaved, isLoading }) {
  const { t, label } = useLanguage();
  const [saved, setSaved] = useState(user);
  const [draft, setDraft] = useState(() => draftFrom(user));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [refreshError, setRefreshError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true);
  const firstField = useRef(null);
  const editButton = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true); setRefreshError(false);
    getUserProfile(user.user_id).then(({ user: latest }) => {
      if (!current) return;
      setSaved(latest); setDraft(draftFrom(latest));

      onProfileSaved(latest);
    }).catch(() => { if (current) setRefreshError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [user.user_id, attempt, onProfileSaved]);

  useEffect(() => {
    if (editing) firstField.current?.focus();
  }, [editing]);

  const endEditing = () => {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setStatus('');
    try {
      const payload = { ...draft, name: draft.name.trim() };
      for (const key of Object.keys(payload)) if (payload[key] === '') payload[key] = null;
      const { user: latest } = await updateUserProfile(user.user_id, payload);
      if (!alive.current) return;

      setSaved(latest); setDraft(draftFrom(latest));
      onProfileSaved(latest); setStatus('saved'); endEditing();
    } catch { if (alive.current) setStatus('error'); }
    finally { if (alive.current) setSaving(false); }
  };

  const display = (key) => {
    const value = saved[key];
    if (value === null || value === undefined || value === '') return t('notProvided');
    if (key === 'disability_status') return t(value ? 'yes' : 'no');
    if (key === 'annual_income') return '₹' + Number(value).toLocaleString('en-IN');
    return label(String(value));
  };
  const fields = [
    ['annual_income', 'income'], ['age', 'age'], ['family_size', 'family'],
    ['location_zone', 'zone'], ['occupation', 'occupation'], ['gender', 'gender'],
    ['social_category', 'category'], ['landholding_acres', 'land'], ['disability_status', 'disability'],
  ];

  return (
    <section className="content-page narrow-page">
      <div className="page-heading">
        <p className="eyebrow">{t('profile')}</p>
        <h1>{t(editing ? 'editDetails' : 'savedDetails')}</h1>
        <p>{t('savedDetailsBody')}</p>
      </div>
      {refreshError && <div className="notice notice-error" role="alert">
        {t('profileRefreshError')}
        <button className="text-link" onClick={() => setAttempt(attempt + 1)}>{t('retry')}</button>
      </div>}
      <div className="panel profile-form" aria-busy={loading}>
        <div className="profile-identity">
          <span className="profile-monogram" aria-hidden="true">{Array.from(saved.name || 'C')[0]}</span>
          <div><h2>{saved.name || t('profile')}</h2><p>{saved.email}</p></div>
        </div>
        {loading ? <p className="profile-loading" role="status">{t('loading')}</p> : editing ? (
          <form onSubmit={save}>
            <fieldset disabled={saving}>
              <label className="field profile-name">{t('fullName')}
                <input ref={firstField} name="name" autoComplete="name" value={draft.name} required
                  pattern=".*\S.*" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <DemographicFields value={draft} onChange={(value) => { setDraft(value); setStatus(''); }} />
              {status && <p className="notice notice-error" role="alert">{t(status)}</p>}
              <div className="form-actions">
                <button className="button button-primary" type="submit"><Save size={17} />{saving ? t('loading') : t('save')}</button>
                <button className="button button-outline" type="button" onClick={() => {
                  setDraft(draftFrom(saved)); setStatus(''); endEditing();
                }}>{t('cancel')}</button>
              </div>
            </fieldset>
          </form>
        ) : (
          <>
            <dl className="profile-details">
              {fields.map(([key, title]) => <div key={key}><dt>{t(title)}</dt><dd>{display(key)}</dd></div>)}
            </dl>
            {status && <p className="notice" role="status">{t(status)}</p>}
            <div className="form-actions">
              <button ref={editButton} className="button button-outline" disabled={refreshError || isLoading}
                onClick={() => { setDraft(draftFrom(saved)); setStatus(''); setEditing(true); }}>
                <Pencil size={17} />{t('editDetails')}
              </button>
              <button className="button button-primary" disabled={refreshError || isLoading}
                onClick={() => onRunMatch(saved)}>{isLoading ? t('loading') : t('match')}<ArrowRight size={17} /></button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
