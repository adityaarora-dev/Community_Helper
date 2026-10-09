import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getAllSchemes } from '../services/api';
import { useLanguage } from '../i18n';
import SchemeCard from './SchemeCard';

export default function SchemeCatalogView({ initialCategory = '' }) {
  const { t, label, language } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true; setLoading(true); setError(false);
    getAllSchemes().then((data) => { if (current) setSchemes(data.schemes || []); }).catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt]);
  const filtered = schemes.filter((s) => (!category || s.category === category) && [s.scheme_name, s.description, s.category, label(s.category)].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className="content-page"><div className="page-heading"><p className="eyebrow">{t('schemes')}</p><h1>{t('step2')}</h1><p>{t('catalogBody')}</p></div><div className="catalog-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">{t('search')}</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} /></label><label className="field"><span className="sr-only">{t('all')}</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">{t('all')}</option>{[...new Set(schemes.map((s) => s.category))].map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label></div>
    {language !== 'English' && <p className="source-note">{t('sourceNote')}</p>}
    {loading ? <p className="empty-state" role="status">{t('loading')}</p> : error ? <div className="notice notice-error" role="alert">{t('error')}<button className="text-link" onClick={() => setAttempt(attempt + 1)}>{t('retry')}</button></div> : filtered.length ? <div className="card-grid">{filtered.map((s) => <SchemeCard key={s.scheme_id} scheme={s} />)}</div> : <p className="empty-state">{t('noResults')}</p>}
  </section>;
}
