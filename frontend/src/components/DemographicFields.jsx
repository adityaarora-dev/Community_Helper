import React from 'react';
import { useLanguage } from '../i18n';

export const EMPTY_DEMOGRAPHICS = { annual_income: null, age: null, family_size: null, location_zone: '', occupation: '', gender: '', social_category: '', disability_status: false, landholding_acres: null };
export const ZONES = ['North Zone', 'South Zone', 'Central Zone', 'East Zone', 'West Zone'];

export default function DemographicFields({ value, onChange, compact = false }) {
  const { t, label } = useLanguage();
  const set = (key, next) => onChange({ ...value, [key]: next });
  const numeric = (key, title, min, max, step = '1') => <label className="field">{t(title)}<input name={key} type="number" min={min} max={max} step={step} value={value[key] ?? ''} onChange={(e) => set(key, e.target.value === '' ? null : Number(e.target.value))} /></label>;
  const select = (key, title, options) => {
    // Keep existing account values visible even when they are outside the common presets.
    const choices = value[key] && !options.includes(value[key]) ? [...options, value[key]] : options;
    return <label className="field">{t(title)}<select name={key} value={value[key] || ''} onChange={(e) => set(key, e.target.value)}><option value="">{t('choose')}</option>{choices.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>;
  };
  return <div className={compact ? 'form-stack' : 'form-grid'}>
    {numeric('annual_income', 'income', 0, undefined, 'any')}
    {numeric('age', 'age', 0, 120)}
    {numeric('family_size', 'family', 1, undefined)}
    {select('location_zone', 'zone', ZONES)}
    {select('occupation', 'occupation', ['Farmer', 'Street Vendor', 'Student', 'Daily Wage Worker', 'Homemaker', 'Self Employed'])}
    {select('gender', 'gender', ['Male', 'Female', 'Other'])}
    {select('social_category', 'category', ['General', 'SC/ST/OBC', 'BPL'])}
    {numeric('landholding_acres', 'land', 0, undefined, 'any')}
    <label className="check-field"><input type="checkbox" name="disability_status" checked={!!value.disability_status} onChange={(e) => set('disability_status', e.target.checked)} />{t('disability')}</label>
  </div>;
}
