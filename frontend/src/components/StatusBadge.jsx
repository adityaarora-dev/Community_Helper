import React from 'react';

export default function StatusBadge({ status, text }) {
  return (
    <span className={`status-badge ${status}`}>
      <span className="status-dot"></span>
      <span>{text}</span>
    </span>
  );
}
