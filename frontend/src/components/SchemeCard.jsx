import React from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function SchemeCard({ scheme }) {
  const { t, label } = useLanguage();
  let officialUrl = null;
  try { const url = new URL(scheme.official_url); if (['https:', 'http:'].includes(url.protocol)) officialUrl = url.href; } catch { /* No official URL. */ }
  return <article className="panel scheme-card"><div className="scheme-category">{label(scheme.category)}</div><h2>{scheme.scheme_name}</h2><p className="scheme-description">{scheme.description}</p><div className="benefit-row"><span>{t('benefit')}</span><strong>₹{Number(scheme.total_benefit_value).toLocaleString('en-IN')}</strong></div>
    <details><summary>{t('documents')}<ChevronDown size={17} /></summary><ul className="document-list">{(scheme.required_documents || '').split(',').filter(Boolean).map((doc, i) => <li key={i}>{doc.trim()}</li>)}</ul><dl className="rule-list">{scheme.max_income != null && <><dt>{t('incomeLimit')}</dt><dd>₹{Number(scheme.max_income).toLocaleString('en-IN')}</dd></>}{scheme.min_age != null && <><dt>{t('ageRange')}</dt><dd>{scheme.min_age}–{scheme.max_age}</dd></>}{scheme.target_occupation && <><dt>{t('occupation')}</dt><dd>{label(scheme.target_occupation)}</dd></>}{scheme.target_gender && <><dt>{t('gender')}</dt><dd>{label(scheme.target_gender)}</dd></>}{scheme.target_social_category && <><dt>{t('category')}</dt><dd>{label(scheme.target_social_category)}</dd></>}{scheme.min_family_size != null && <><dt>{t('family')}</dt><dd>≥ {scheme.min_family_size}</dd></>}{scheme.max_landholding != null && <><dt>{t('land')}</dt><dd>≤ {scheme.max_landholding}</dd></>}{scheme.requires_disability && <><dt>{t('disability')}</dt><dd>✓</dd></>}</dl></details>
    {officialUrl && <a className="text-link scheme-link" href={officialUrl} target="_blank" rel="noopener noreferrer">{t('official')}<ArrowUpRight size={17} /></a>}
  </article>;
}
