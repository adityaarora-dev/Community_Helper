import React from 'react';
import StatusBadge from './StatusBadge';

export default function Header({ status, statusText }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-icon">⚡</div>
        <div>
          <h1>Supabase Connection Dashboard</h1>
          <p className="subtitle">IPv4 Session Pooler (Port 5432) &bull; React Client &bull; Express Health Router</p>
        </div>
      </div>
      <div className="header-right">
        <StatusBadge status={status} text={statusText} />
      </div>
    </header>
  );
}
