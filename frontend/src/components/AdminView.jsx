import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import api from '../services/adminApi';
import { ZONES } from './DemographicFields';

const emptyRule = () => ({ max_income: '', min_age: 0, max_age: 120, min_family_size: 1, target_gender: '', target_occupation: '', target_social_category: '', requires_disability: false, max_landholding: '' });
const emptyScheme = () => ({ scheme_name: '', description: '', category: 'Housing', total_benefit_value: '', required_documents: '', official_url: '', location_zone: '', rules: [emptyRule()] });
const emptyCenter = () => ({ name: '', address: '', location_zone: '', contact_phone: '', operating_hours: '' });
const message = (error) => error.response?.data?.message || 'Unable to connect. Please try again.';

function RecordForm({ kind, initial, busy, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial);
  const scheme = kind === 'schemes';
  const set = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const field = (key, label, { required = false, type = 'text', maxLength, multiline = false } = {}) => <label className="field">{label}{multiline ? <textarea rows={3} required={required} maxLength={maxLength} value={draft[key] ?? ''} onChange={(e) => set(key, e.target.value)} /> : <input type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} required={required} maxLength={maxLength} value={draft[key] ?? ''} onChange={(e) => set(key, e.target.value)} />}</label>;
  const ruleField = (rule, index, key, label, numeric = false, max) => <label className="field">{label}<input type={numeric ? 'number' : 'text'} min={key === 'min_family_size' ? 1 : numeric ? 0 : undefined} max={max} step={numeric && !['min_age', 'max_age', 'min_family_size'].includes(key) ? 'any' : undefined} maxLength={numeric ? undefined : key === 'target_occupation' ? 100 : 50} value={rule[key] ?? ''} onChange={(e) => set('rules', draft.rules.map((r, i) => i === index ? { ...r, [key]: e.target.value } : r))} /></label>;
  return <form className="panel admin-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
    <h2>{initial.scheme_id || initial.center_id ? 'Edit' : 'Add'} {scheme ? 'scheme' : 'service center'}</h2>
    <fieldset disabled={busy}>
      <div className="form-grid">
        {field(scheme ? 'scheme_name' : 'name', 'Name', { required: true, maxLength: 255 })}
        <label className="field">Zone<select required={!scheme} value={draft.location_zone ?? ''} onChange={(e) => set('location_zone', e.target.value)}><option value="">{scheme ? 'All areas / national' : 'Choose a zone'}</option>{[...new Set([...ZONES, ...(draft.location_zone ? [draft.location_zone] : [])])].map((zone) => <option key={zone}>{zone}</option>)}</select></label>
        {scheme ? <>
          {field('category', 'Category', { required: true, maxLength: 100 })}
          {field('total_benefit_value', 'Benefit value (₹)', { required: true, type: 'number' })}
          {field('description', 'Description', { required: true, multiline: true, maxLength: 10000 })}
          {field('required_documents', 'Required documents', { multiline: true, maxLength: 10000 })}
          {field('official_url', 'Official website', { type: 'url', maxLength: 500 })}
        </> : <>
          {field('address', 'Address', { required: true, multiline: true, maxLength: 10000 })}
          {field('contact_phone', 'Contact phone', { type: 'tel', maxLength: 50 })}
          {field('operating_hours', 'Opening hours', { maxLength: 100 })}
        </>}
      </div>
      {scheme && <div className="admin-rules"><h3>Eligibility</h3><p className="muted">Leave optional limits blank for no restriction. A citizen may qualify through any one rule set.</p>
        {draft.rules.map((rule, index) => <fieldset className="admin-rule" key={index}><legend>Rule set {index + 1}</legend><div className="form-grid">
          {ruleField(rule, index, 'max_income', 'Maximum annual income (₹)', true)}
          {ruleField(rule, index, 'min_family_size', 'Minimum family members', true, 1000)}
          {ruleField(rule, index, 'min_age', 'Minimum age', true, 120)}
          {ruleField(rule, index, 'max_age', 'Maximum age', true, 120)}
          {ruleField(rule, index, 'target_gender', 'Gender (blank = all)')}
          {ruleField(rule, index, 'target_occupation', 'Occupation (blank = all)')}
          {ruleField(rule, index, 'target_social_category', 'Social category (blank = all)')}
          {ruleField(rule, index, 'max_landholding', 'Maximum land owned (acres)', true)}
          <label className="check-field"><input type="checkbox" checked={rule.requires_disability} onChange={(e) => set('rules', draft.rules.map((r, i) => i === index ? { ...r, requires_disability: e.target.checked } : r))} />Requires a disability</label>
        </div>{draft.rules.length > 1 && <button type="button" className="text-link" onClick={() => set('rules', draft.rules.filter((_, i) => i !== index))}>Remove this rule set</button>}</fieldset>)}
        <button type="button" className="button button-outline" disabled={draft.rules.length >= 20} onClick={() => set('rules', [...draft.rules, emptyRule()])}><Plus size={16} />Add rule set</button>
        <p className="muted admin-hint">Publishing a new scheme with a zone notifies accounts in that zone. Editing an existing scheme does not send another alert.</p>
      </div>}
      <div className="form-actions"><button type="submit" className="button button-primary">{busy ? 'Saving…' : initial.scheme_id || initial.center_id ? 'Save changes' : scheme ? 'Publish scheme' : 'Add service center'}</button><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button></div>
    </fieldset>
  </form>;
}

export default function AdminView() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [kind, setKind] = useState('schemes');
  const [data, setData] = useState({ schemes: [], 'service-centers': [] });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const clear = () => { setAdmin(null); setData({ schemes: [], 'service-centers': [] }); setEditing(null); setDeleting(null); setNotice(''); };
  useEffect(() => {
    let current = true;
    const expired = () => { clear(); setError('Your admin session has expired. Please sign in again.'); };
    window.addEventListener('admin-session-expired', expired);
    if (sessionStorage.getItem('civic_admin_token')) api.get('/me').then(({ data }) => { if (current) setAdmin(data.admin); }).catch((e) => { if (current) setError(message(e)); }).finally(() => { if (current) setChecking(false); });
    else setChecking(false);
    return () => { current = false; window.removeEventListener('admin-session-expired', expired); };
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [schemes, centers] = await Promise.all([api.get('/schemes'), api.get('/service-centers')]);
      setData({ schemes: schemes.data.schemes, 'service-centers': centers.data.service_centers });
    } catch (e) { setError(message(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (admin) load(); }, [admin]);
  const login = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const { data } = await api.post('/login', credentials); sessionStorage.setItem('civic_admin_token', data.token); setCredentials({ email: '', password: '' }); setAdmin(data.admin); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const logout = async () => {
    setBusy(true); setError('');
    try { await api.post('/logout'); sessionStorage.removeItem('civic_admin_token'); clear(); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const save = async (draft) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const id = draft.scheme_id || draft.center_id;
      await api.request({ url: `/${kind}${id ? `/${id}` : ''}`, method: id ? 'put' : 'post', data: draft });
      setEditing(null); setNotice(id ? 'Changes saved.' : kind === 'schemes' ? 'Scheme published. Zone notifications have been saved for matching accounts.' : 'Service center added.');
      await load();
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError(''); setNotice('');
    try { await api.delete(`/${kind}/${deleting.scheme_id || deleting.center_id}`); setDeleting(null); setNotice('Record deleted.'); await load(); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const changeKind = (value) => { setKind(value); setEditing(null); setDeleting(null); setSearch(''); setError(''); setNotice(''); };
  const visible = data[kind].filter((item) => [item.scheme_name || item.name, item.location_zone, item.category, item.address].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()));
  return <div className="app-shell admin-shell" lang="en">
    <header className="site-header"><div className="nav-main admin-nav"><a className="wordmark" href="/">CivicHelper.</a><span className="admin-label"><ShieldCheck size={17} />Administration</span><div className="nav-actions">{admin && <button disabled={busy} className="button button-outline" onClick={logout}><LogOut size={16} />Sign out</button>}<a className="text-link" href="/"><ArrowLeft size={16} />Public site</a></div></div></header>
    <main className="content-page admin-page" id="main-content">
      {checking ? <p role="status">Checking session…</p> : !admin ? <section className="panel admin-login"><p className="eyebrow">CivicHelper administration</p><h1>Welcome back.</h1><p className="muted">Sign in to manage schemes and local service centers.</p><form className="form-stack" onSubmit={login}><fieldset disabled={busy} className="form-stack"><label className="field">Admin email<input type="email" autoComplete="username" required maxLength={255} value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} /></label><label className="field">Password<input type="password" autoComplete="current-password" required maxLength={256} value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} /></label><button className="button button-primary">{busy ? 'Signing in…' : 'Sign in as admin'}</button></fieldset></form></section> : <>
        <div className="page-heading"><p className="eyebrow">Administration · {admin.email}</p><h1>Community resources.</h1><p>Keep support information accurate and useful.</p></div>
        <div className="admin-toolbar"><div className="zone-tabs"><button disabled={busy || !!editing} className={'button ' + (kind === 'schemes' ? 'button-primary' : 'button-outline')} aria-pressed={kind === 'schemes'} onClick={() => changeKind('schemes')}>Schemes ({data.schemes.length})</button><button disabled={busy || !!editing} className={'button ' + (kind === 'service-centers' ? 'button-primary' : 'button-outline')} aria-pressed={kind === 'service-centers'} onClick={() => changeKind('service-centers')}>Service centers ({data['service-centers'].length})</button></div>{!editing && <button disabled={busy || loading} className="button button-primary" onClick={() => { setDeleting(null); setNotice(''); setError(''); setEditing(kind === 'schemes' ? emptyScheme() : emptyCenter()); }}><Plus size={17} />Add {kind === 'schemes' ? 'scheme' : 'service center'}</button>}</div>
        {notice && <p role="status" className="notice">{notice}</p>}
        {editing ? <RecordForm key={editing.scheme_id || editing.center_id || kind} kind={kind} initial={editing} busy={busy} onSave={save} onCancel={() => { setEditing(null); setError(''); }} /> : <>
          <label className="field admin-search">Search {kind === 'schemes' ? 'schemes' : 'service centers'}<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or zone…" /></label>
          {deleting && <section className="notice notice-error admin-delete" role="alert"><h2>Delete {deleting.scheme_name || deleting.name}?</h2><p>{kind === 'schemes' ? 'This permanently removes the scheme, its eligibility rules and related account notifications.' : 'This permanently removes the service center from Local help.'}</p><div className="form-actions"><button disabled={busy} className="button button-danger" onClick={remove}>Confirm deletion</button><button disabled={busy} className="button button-outline" onClick={() => setDeleting(null)}>Cancel</button></div></section>}
          {loading ? <p role="status">Loading resources…</p> : <div className="admin-records">{visible.map((item) => <article className="panel admin-record" key={item.scheme_id || item.center_id}><div><p className="eyebrow">{item.location_zone || 'All areas / national'}{item.category ? ` · ${item.category}` : ''}</p><h2>{item.scheme_name || item.name}</h2><p className="muted">{kind === 'schemes' ? item.description : item.address}</p>{kind === 'service-centers' && <p className="muted">{[item.contact_phone, item.operating_hours].filter(Boolean).join(' · ')}</p>}</div><div className="admin-record-actions"><button disabled={busy || !!deleting} className="button button-outline" aria-label={`Edit ${item.scheme_name || item.name}`} onClick={() => { setNotice(''); setError(''); setEditing({ ...item, ...(kind === 'schemes' ? { rules: item.rules.length ? item.rules : [emptyRule()] } : {}) }); }}><Pencil size={15} />Edit</button><button disabled={busy || !!deleting} className="button button-outline" aria-label={`Delete ${item.scheme_name || item.name}`} onClick={() => setDeleting(item)}><Trash2 size={15} />Delete</button></div></article>)}{!visible.length && <p className="empty-state">No matching resources.</p>}</div>}
        </>}
      </>}
      {error && <div className="notice notice-error" role="alert">{error}{admin && !editing && <button className="text-link" disabled={busy || loading} onClick={() => { setError(''); load(); }}>Retry loading</button>}</div>}
    </main>
  </div>;
}
