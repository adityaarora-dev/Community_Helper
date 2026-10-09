import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';
import { getServiceCenters } from '../services/api';
import { useLanguage } from '../i18n';
import { ZONES } from './DemographicFields';

export default function ServiceCentersView({ defaultZone = 'All Zones' }) {
  const { t, label, language } = useLanguage();
  const [zone, setZone] = useState(defaultZone);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true; setLoading(true); setError(false);
    getServiceCenters(zone).then((data) => { if (current) setCenters(data.service_centers || []); }).catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [zone, attempt]);
  return <section className="content-page"><div className="page-heading"><p className="eyebrow">{t('centers')}</p><h1>{t('together')}</h1><p>{t('centersBody')}</p></div><div className="zone-tabs">{['All Zones', ...ZONES].map((value) => <button key={value} aria-pressed={zone === value} className={'button ' + (zone === value ? 'button-primary' : 'button-outline')} onClick={() => setZone(value)}>{label(value)}</button>)}</div>
    {language !== 'English' && <p className="source-note">{t('sourceNote')}</p>}
    {loading ? <p className="empty-state" role="status">{t('loading')}</p> : error ? <div className="notice notice-error" role="alert">{t('error')}<button className="text-link" onClick={() => setAttempt(attempt + 1)}>{t('retry')}</button></div> : centers.length ? <div className="card-grid">{centers.map((center) => <article key={center.center_id} className="panel center-card"><span className="scheme-category">{label(center.location_zone)}</span><h2>{center.name}</h2><p><MapPin size={18} />{center.address}</p><p><Phone size={17} /><a href={'tel:' + center.contact_phone}>{center.contact_phone}</a></p><p><Clock size={17} />{center.operating_hours}</p><a className="button button-outline" href={'https://maps.google.com/?q=' + encodeURIComponent(center.name + ' ' + center.address)} target="_blank" rel="noopener noreferrer">{t('directions')}<ArrowUpRight size={17} /></a></article>)}</div> : <p className="empty-state">{t('noResults')}</p>}
  </section>;
}
