import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications, markNotificationRead } from './api';

export default function useNotifications(user) {
  const [state, setState] = useState({ notifications: [], unreadCount: 0, loading: true, error: false });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!user?.user_id) return;
    const current = ++generation.current;
    try {
      const data = await getNotifications();
      if (current === generation.current) setState({ ...data, loading: false, error: false });
    } catch {
      if (current === generation.current) setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [user?.user_id]);
  useEffect(() => {
    setState({ notifications: [], unreadCount: 0, loading: !!user, error: false });
    refresh();
    const timer = user ? setInterval(refresh, 30000) : null;
    const focus = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', focus);
    return () => { ++generation.current; clearInterval(timer); document.removeEventListener('visibilitychange', focus); };
  }, [refresh, user?.location_zone]);
  const markRead = async (id) => { await markNotificationRead(id); await refresh(); };
  return { ...state, refresh, markRead };
}
