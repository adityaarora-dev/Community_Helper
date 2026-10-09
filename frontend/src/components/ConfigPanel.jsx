import React from 'react';

export default function ConfigPanel({
  backendUrl,
  setBackendUrl,
  onCheckHealth,
  isLoading,
  autoRefresh,
  setAutoRefresh,
}) {
  return (
    <section className="card config-card">
      <div className="card-header">
        <h2>Server Configuration</h2>
      </div>
      <div className="config-grid">
        <div className="input-group">
          <label htmlFor="backendUrl">Backend Server URL</label>
          <input
            id="backendUrl"
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:5000"
          />
        </div>
        <div className="actions-group">
          <button
            onClick={onCheckHealth}
            disabled={isLoading}
            className="btn btn-primary"
          >
            <span className="btn-icon">🔄</span>{' '}
            {isLoading ? 'Checking...' : 'Check Health Now'}
          </button>
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-switch"></span>
            <span className="toggle-label">Auto-check (every 5s)</span>
          </label>
        </div>
      </div>
    </section>
  );
}
