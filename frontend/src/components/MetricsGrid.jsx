import React from 'react';

export default function MetricsGrid({ metrics }) {
  const { dbStatus, dbName, latency, poolCount, poolSub, lastTime, lastDate, isConnected } = metrics;

  return (
    <section className="metrics-grid">
      <div className="metric-card">
        <div className="metric-label">Database Status</div>
        <div
          className="metric-value"
          style={{ color: isConnected ? '#3fb950' : '#f85149' }}
        >
          {dbStatus}
        </div>
        <div className="metric-sub">{dbName}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Latency / Response Time</div>
        <div className="metric-value">{latency !== null ? `${latency} ms` : '-- ms'}</div>
        <div className="metric-sub">Roundtrip health check</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Connection Pool</div>
        <div className="metric-value">{poolCount}</div>
        <div className="metric-sub">{poolSub}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Last Ping Time</div>
        <div className="metric-value timestamp">{lastTime}</div>
        <div className="metric-sub">{lastDate}</div>
      </div>
    </section>
  );
}
