import React from 'react';
import { useLanguage } from '../i18n';
import DemographicFields from './DemographicFields';

export default function StructuredFilterPanel({ demographics, onChange, onApply, onReset, isLoading }) {
  const { t } = useLanguage();
  return <aside className="panel filter-panel"><h2>{t('profile')}</h2><p className="muted">{t('profileBody')}</p><form onSubmit={(e) => { e.preventDefault(); onApply(); }}><fieldset disabled={isLoading}><DemographicFields value={demographics} onChange={onChange} compact /><div className="form-stack filter-actions"><button className="button button-primary full-width" type="submit">{isLoading ? t('loading') : t('match')}</button><button className="text-link" type="button" onClick={onReset}>{t('reset')}</button></div></fieldset></form></aside>;
}
