/**
 * Follow-Up Radar Dedicated View
 * Displays all overdue applications needing follow-up with snooze and draft triggers
 */
import React from 'react';
import { PendingFollowUp } from '../types/followup.types.js';
import { Clock, Send, BellOff, CheckCircle } from 'lucide-react';

interface FollowUpRadarViewProps {
  pendingFollowUps: PendingFollowUp[];
  onOpenDraft: (applicationId: string, companyName: string, roleTitle: string) => void;
  onDismiss: (applicationId: string) => void;
}

export const FollowUpRadarView: React.FC<FollowUpRadarViewProps> = ({
  pendingFollowUps,
  onOpenDraft,
  onDismiss
}) => {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Follow-Up Radar
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Applications with no recruiter response in 7+ days. 90% of conversions happen on follow-ups!
        </p>
      </div>

      {pendingFollowUps.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}
        >
          <CheckCircle size={36} style={{ color: 'var(--stage-offer)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            All caught up!
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            No dormant applications require attention right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingFollowUps.map((item) => (
            <div
              key={item.applicationId}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.companyName}
                  </h4>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--stage-oa)',
                      border: '1px solid var(--stage-oa)'
                    }}
                  >
                    <Clock size={11} />
                    7+ Days Dormant
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {item.roleTitle}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => onDismiss(item.applicationId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <BellOff size={13} />
                  <span>Snooze 7d</span>
                </button>

                <button
                  onClick={() => onOpenDraft(item.applicationId, item.companyName, item.roleTitle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={13} />
                  <span>1-Click Draft</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpRadarView;
