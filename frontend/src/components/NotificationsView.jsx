import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { getSchemeById } from '../services/api';
import SchemeCard from './SchemeCard';

export default function NotificationsView({ inbox, user, onProfile }) {
  const { t, label } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const open = async (notification) => {
    setBusy(true); setError(false); setSelected(null);
    try {
      const data = await getSchemeById(notification.scheme_id);
      await inbox.markRead(notification.notification_id);
      setSelected(data.scheme);
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  return <section className="content-page narrow-page">
    <div className="page-heading"><p className="eyebrow">{t('notifications')}</p><h1>{t('zoneUpdates')}</h1><p>{t('zoneAlertsHint')}</p></div>
    {!user.location_zone && <p className="notice">{t('chooseZoneAlerts')} <button className="text-link" onClick={onProfile}>{t('editDetails')}</button></p>}
    {inbox.error ? <p className="notice notice-error" role="alert">{t('error')} <button className="text-link" onClick={inbox.refresh}>{t('retry')}</button></p> : inbox.loading ? <p role="status">{t('loading')}</p> : !inbox.notifications.length ? <p className="empty-state">{t('noNotifications')}</p> : <ul className="notification-list">
      {inbox.notifications.map((item) => <li key={item.notification_id} className={'panel notification-item ' + (!item.read_at ? 'is-unread' : '')}>
        <div><p className="eyebrow">{!item.read_at && <span className="unread-dot" aria-label={t('unread')} />} {label(item.location_zone)}</p><h2>{item.scheme_name}</h2><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(document.documentElement.lang)}</time></div>
        <button className="button button-outline" disabled={busy} onClick={() => open(item)}>{t('viewScheme')}</button>
      </li>)}
    </ul>}
    {busy && <p role="status">{t('loading')}</p>}
    {error && <p className="notice notice-error" role="alert">{t('error')}</p>}
    {selected && <div className="notification-detail" role="region" aria-label={t('viewScheme')}><SchemeCard scheme={selected} /></div>}
  </section>;
}
