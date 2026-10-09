import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  ArrowRight,
  Database,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  Clock,
  AlertTriangle,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n';

function SqlCollapsible({ sql, executionTimeMs, rowCount, thought }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sql) return null;

  return (
    <div className="sql-accordion">
      <button
        type="button"
        className="sql-accordion-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="sql-trigger-left">
          <Terminal size={14} className="sql-icon" />
          <span>Executed SQL</span>
          {executionTimeMs !== undefined && (
            <span className="sql-meta-chip">
              <Clock size={11} /> {executionTimeMs}ms
            </span>
          )}
          {rowCount !== undefined && (
            <span className="sql-meta-chip">
              <Database size={11} /> {rowCount} {rowCount === 1 ? 'row' : 'rows'}
            </span>
          )}
        </span>
        <span className="sql-trigger-right">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="sql-accordion-content">
          {thought && (
            <div className="sql-thought-box">
              <strong>Query Intent & Reasoning:</strong>
              <p>{thought}</p>
            </div>
          )}
          <div className="sql-code-container">
            <pre className="sql-code-block">
              <code>{sql}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function DataTableViewer({ rows, columns }) {
  const [showTable, setShowTable] = useState(false);

  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return null;
  }

  // Hide system/internal columns from quick preview if too wide
  const displayColumns = columns.filter(
    (c) => !['scheme_id', 'rule_id', 'center_id', 'interaction_id'].includes(c)
  );
  const activeColumns = displayColumns.length > 0 ? displayColumns : columns;

  return (
    <div className="data-table-viewer">
      <button
        type="button"
        className="table-toggle-btn"
        onClick={() => setShowTable(!showTable)}
      >
        <TableIcon size={13} />
        <span>{showTable ? 'Hide Query Data Table' : `View Data Table (${rows.length} rows)`}</span>
        {showTable ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {showTable && (
        <div className="table-responsive-wrapper">
          <table className="mini-results-table">
            <thead>
              <tr>
                {activeColumns.map((col) => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((row, rIdx) => (
                <tr key={rIdx}>
                  {activeColumns.map((col) => {
                    const val = row[col];
                    const formatted =
                      val === null || val === undefined
                        ? '—'
                        : typeof val === 'object'
                        ? JSON.stringify(val)
                        : String(val);
                    return <td key={col}>{formatted}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 15 && (
            <p className="table-truncation-note">
              Showing first 15 of {rows.length} rows returned.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({ messages, onSendMessage, isLoading, onSwitchToIntake }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const thread = useRef(null);

  useEffect(() => {
    if (thread.current) {
      thread.current.scrollTop = thread.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <section className="panel chat-panel">
      <div className="chat-header">
        <div className="chat-header-title">
          <h2>{t('assistant')}</h2>
          <span className="live-ai-badge">
            <Sparkles size={12} /> Text-to-SQL AI
          </span>
        </div>
        <button className="text-link" onClick={onSwitchToIntake}>
          {t('profile')}
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="chat-thread" ref={thread} role="log" aria-live="polite" aria-label={t('assistant')}>
        {/* Welcome Message */}
        <div className="message assistant-message">
          <span className="message-byline">CivicHelper AI • Text-to-SQL Engine</span>
          <p>
            Welcome! I am connected directly to our Supabase PostgreSQL database. You can ask me
            any questions in plain English or Hindi (e.g., <em>"Show all healthcare schemes"</em>,{' '}
            <em>"Which ones give over ₹1 Lakh?"</em>, <em>"How many farmers schemes exist?"</em>, or{' '}
            <em>"Where are the help centers in North Zone?"</em>).
          </p>
        </div>

        {/* Message Thread */}
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div
              className={`message ${isUser ? 'user-message' : 'assistant-message'} ${
                message.error ? 'message-error-state' : ''
              }`}
              key={index}
            >
              {!isUser && (
                <span className="message-byline">
                  {message.error ? 'CivicHelper Alert' : 'CivicHelper Assistant'}
                </span>
              )}

              {/* Error Message Display */}
              {message.error ? (
                <div className="chat-error-card">
                  <div className="chat-error-header">
                    <AlertTriangle size={16} />
                    <span>{message.errorType || 'Operation Error'}</span>
                  </div>
                  <p className="chat-error-body">{message.content}</p>
                  {message.attemptedSql && (
                    <div className="chat-error-sql">
                      <strong>Attempted SQL:</strong>
                      <code>{message.attemptedSql}</code>
                    </div>
                  )}
                </div>
              ) : (
                <div className="message-text-content">
                  <p>{message.content}</p>
                </div>
              )}

              {/* Zero-Results Indicator */}
              {!isUser && !message.error && message.sql && message.rowCount === 0 && (
                <div className="empty-result-indicator">
                  <Database size={13} />
                  <span>No matching records found in the database.</span>
                </div>
              )}

              {/* SQL Collapsible Details */}
              {!isUser && message.sql && (
                <SqlCollapsible
                  sql={message.sql}
                  executionTimeMs={message.executionTimeMs}
                  rowCount={message.rowCount}
                  thought={message.thought}
                />
              )}

              {/* Data Table Viewer */}
              {!isUser && message.rows && message.rows.length > 0 && (
                <DataTableViewer rows={message.rows} columns={message.columns} />
              )}

              {/* Matched Count Meta */}
              {!isUser && message.matchedCount !== undefined && message.matchedCount > 0 && (
                <span className="message-meta">
                  {t('matches')}: {message.matchedCount}
                </span>
              )}
            </div>
          );
        })}

        {/* Active Thinking State */}
        {isLoading && (
          <div className="message assistant-message thinking-bubble" role="status">
            <span className="message-byline">CivicHelper Assistant</span>
            <div className="thinking-row">
              <span className="pulsing-dot" />
              <span>Analyzing query, generating PostgreSQL SQL & querying database...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Compose Form */}
      <form className="chat-compose" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          {t('chatPlaceholder')}
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chatPlaceholder')}
          rows={2}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form.requestSubmit();
            }
          }}
        />
        <button
          className="button button-primary icon-button"
          disabled={isLoading || !input.trim()}
          aria-label={t('send')}
          type="submit"
        >
          <ArrowUp size={22} />
        </button>
      </form>
    </section>
  );
}
