import React from 'react';
import { CheckCircle2, CircleAlert, Link2, RefreshCw } from 'lucide-react';
import { User } from '../features/auth/types/auth.types.js';

interface GmailSyncStatusProps {
  user: User | null;
  isSyncing: boolean;
  lastManualSyncAt: string | null;
  error: string | null;
  onConnect: () => void;
  onSync: () => void;
}

function hasActiveGmailWatch(user: User | null): boolean {
  if (!user?.hasGoogleLinked || !user.googleWatchExpiry) return false;
  const expiry = Date.parse(user.googleWatchExpiry);
  return Number.isFinite(expiry) && expiry > Date.now();
}

function formatSyncTime(value: string): string | null {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

export function GmailSyncStatus({
  user,
  isSyncing,
  lastManualSyncAt,
  error,
  onConnect,
  onSync
}: GmailSyncStatusProps) {
  if (!user) return null;

  const activeWatch = hasActiveGmailWatch(user);
  const lastSyncLabel = lastManualSyncAt ? formatSyncTime(lastManualSyncAt) : null;

  let icon = <CheckCircle2 size={16} style={{ color: 'var(--stage-offer)' }} />;
  let message = 'Gmail connected. Automatic tracking is active.';
  let actionLabel = 'Sync now';
  let onAction = onSync;

  if (isSyncing) {
    icon = <RefreshCw size={16} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />;
    message = 'Scanning Gmail. This can take a moment.';
    actionLabel = 'Syncing…';
  } else if (error) {
    icon = <CircleAlert size={16} style={{ color: 'var(--stage-rejected)' }} />;
    message = error;
    actionLabel = user.hasGoogleLinked ? 'Try again' : 'Reconnect Gmail';
    onAction = user.hasGoogleLinked ? onSync : onConnect;
  } else if (!user.hasGoogleLinked) {
    icon = <Link2 size={16} style={{ color: 'var(--text-muted)' }} />;
    message = 'Gmail is not connected.';
    actionLabel = 'Connect Gmail';
    onAction = onConnect;
  } else if (!activeWatch) {
    icon = <CircleAlert size={16} style={{ color: 'var(--stage-oa)' }} />;
    message = 'Automatic Gmail tracking needs reconnection.';
    actionLabel = 'Reconnect Gmail';
    onAction = onConnect;
  }

  return (
    <div
      style={{
        margin: '12px 20px 0',
        padding: '9px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.78rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {icon}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{message}</span>
        {lastSyncLabel && !error && !isSyncing && (
          <span style={{ color: 'var(--text-muted)' }}>Last manual sync: {lastSyncLabel}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={isSyncing}
        style={{
          padding: '5px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: isSyncing ? 'not-allowed' : 'pointer',
          opacity: isSyncing ? 0.7 : 1
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function isGmailWatchActive(user: User | null): boolean {
  return hasActiveGmailWatch(user);
}
