import React from 'react';

export default function ArchitectureCard() {
  return (
    <section className="card info-card">
      <div className="card-header">
        <h2>Architecture & Constraints</h2>
      </div>
      <div className="info-grid">
        <div className="info-item">
          <strong>Pooler Mode:</strong>
          <span>IPv4 Session Pooler (port 5432) for stable mobile hotspot connectivity</span>
        </div>
        <div className="info-item">
          <strong>SSL Requirement:</strong>
          <span><code>ssl: &#123; rejectUnauthorized: false &#125;</code> enabled for local environments</span>
        </div>
        <div className="info-item">
          <strong>Pool Limits:</strong>
          <span><code>max: 10</code>, <code>idleTimeoutMillis: 30000</code></span>
        </div>
        <div className="info-item">
          <strong>Error Handling:</strong>
          <span>Idle client error listener prevents server termination on socket drops</span>
        </div>
      </div>
    </section>
  );
}
