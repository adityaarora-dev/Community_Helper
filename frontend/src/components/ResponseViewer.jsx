import React from 'react';

export default function ResponseViewer({ responseData, httpBadge, isSuccess }) {
  return (
    <section className="card response-card">
      <div className="card-header">
        <h2>Live Health Router Response (<code>GET /health</code>)</h2>
        <span
          className="badge"
          style={{ color: isSuccess ? '#3fb950' : '#f85149' }}
        >
          {httpBadge}
        </span>
      </div>
      <div className="card-body">
        <pre className="code-block">
          {responseData
            ? JSON.stringify(responseData, null, 2)
            : 'Click "Check Health Now" to test the connection...'}
        </pre>
      </div>
    </section>
  );
}
