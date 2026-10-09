import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import MetricsGrid from './components/MetricsGrid';
import ResponseViewer from './components/ResponseViewer';
import ArchitectureCard from './components/ArchitectureCard';
import { fetchHealthCheck } from './services/api';
import './App.css';

export default function App() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [status, setStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [statusText, setStatusText] = useState('Checking...');
  const [httpBadge, setHttpBadge] = useState('HTTP --');
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const [metrics, setMetrics] = useState({
    dbStatus: '--',
    dbName: 'postgres',
    latency: null,
    poolCount: '-- / 10',
    poolSub: 'Total / Max Limit',
    lastTime: '--:--:--',
    lastDate: 'Awaiting check',
    isConnected: false,
  });

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setStatus('checking');
    setStatusText('Checking...');

    const result = await fetchHealthCheck(backendUrl);

    setResponseData(result.data);
    setHttpBadge(`HTTP ${result.status} ${result.statusText || ''}`);

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();

    if (result.ok && result.data?.status === 'success') {
      setStatus('online');
      setStatusText('Database Connected');
      setIsSuccess(true);

      const db = result.data.database;
      setMetrics({
        dbStatus: 'Connected ✅',
        dbName: `DB: ${db?.name || 'postgres'}`,
        latency: result.elapsed,
        poolCount: db?.pool ? `${db.pool.totalCount} / 10` : 'Active',
        poolSub: db?.pool
          ? `Idle: ${db.pool.idleCount} | Waiting: ${db.pool.waitingCount}`
          : 'Total / Max',
        lastTime: timeStr,
        lastDate: dateStr,
        isConnected: true,
      });
    } else {
      setStatus('offline');
      setStatusText('Offline / Error');
      setIsSuccess(false);

      setMetrics({
        dbStatus: 'Error ❌',
        dbName: 'postgres',
        latency: result.elapsed,
        poolCount: '-- / 10',
        poolSub: 'Unavailable',
        lastTime: timeStr,
        lastDate: 'Failed',
        isConnected: false,
      });
    }

    setIsLoading(false);
  }, [backendUrl]);

  // Initial check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      checkHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, checkHealth]);

  return (
    <div className="app-container">
      <Header status={status} statusText={statusText} />

      <main className="main-content">
        <ConfigPanel
          backendUrl={backendUrl}
          setBackendUrl={setBackendUrl}
          onCheckHealth={checkHealth}
          isLoading={isLoading}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
        />

        <MetricsGrid metrics={metrics} />

        <ResponseViewer
          responseData={responseData}
          httpBadge={httpBadge}
          isSuccess={isSuccess}
        />

        <ArchitectureCard />
      </main>

      <footer className="footer">
        <p>Supabase PostgreSQL React Dashboard &bull; Node.js Express Backend</p>
      </footer>
    </div>
  );
}
