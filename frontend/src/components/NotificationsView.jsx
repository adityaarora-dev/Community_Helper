import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
import { getSchemeById } from '../services/api';
import SchemeCard from './SchemeCard';

export default function NotificationsView({ inbox, user, onProfile }) {
  const { t, label } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const detail = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [readError, setReadError] = useState(false);
  useEffect(() => {
    if (activeNotification) {
      detail.current?.focus({ preventScroll: true });
      detail.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeNotification, selected, error]);
  const markRead = async (notification) => {
    setReadError(false);
    try { await inbox.markRead(notification.notification_id); }
    catch { setReadError(true); }
  };
  const open = async (notification) => {
    setActiveNotification(notification.notification_id);
    setBusy(true); setError(false); setReadError(false); setSelected(null);
    try {
      const data = await getSchemeById(notification.scheme_id);
      setSelected(data.scheme);
      // Reading details must not depend on the notification update succeeding.
      void markRead(notification);
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  return <section className="content-page narrow-page">
    <div className="page-heading"><p className="eyebrow">{t('notifications')}</p><h1>{t('zoneUpdates')}</h1><p>{t('zoneAlertsHint')}</p></div>
    {!user.location_zone && <p className="notice">{t('chooseZoneAlerts')} <button className="text-link" onClick={onProfile}>{t('editDetails')}</button></p>}
    {inbox.error && <p className="notice notice-error" role="alert">{t('error')} <button className="text-link" onClick={inbox.refresh}>{t('retry')}</button></p>}
    {inbox.loading ? <p role="status">{t('loading')}</p> : !inbox.notifications.length ? <p className="empty-state">{t('noNotifications')}</p> : <ul className="notification-list">
      {inbox.notifications.map((item) => <React.Fragment key={item.notification_id}><li className={'panel notification-item ' + (!item.read_at ? 'is-unread' : '')}>
        <div><p className="eyebrow">{!item.read_at && <span className="unread-dot" aria-label={t('unread')} />} {label(item.location_zone)}</p><h2>{item.scheme_name}</h2><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(document.documentElement.lang)}</time></div>
        <button className="button button-outline" disabled={busy} aria-expanded={activeNotification === item.notification_id} aria-controls={activeNotification === item.notification_id ? 'notification-scheme-detail' : undefined} onClick={() => open(item)}>{t('viewScheme')}</button>
      </li>{activeNotification === item.notification_id && <li className="notification-detail" id="notification-scheme-detail" ref={detail} tabIndex={-1} aria-label={t('viewScheme')}>
        {busy && <p role="status">{t('loading')}</p>}
        {error && <p className="notice notice-error" role="alert">{t('error')} <button className="text-link" onClick={() => open(item)}>{t('retry')}</button></p>}
        {selected && <SchemeCard scheme={selected} />}
        {readError && <p className="notice notice-error" role="alert">{t('error')} <button className="text-link" onClick={() => markRead(item)}>{t('retry')}</button></p>}
      </li>}</React.Fragment>)}
    </ul>}
  </section>;
}
