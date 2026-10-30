/**
 * Follow-Up Radar Dedicated View
 * Displays all overdue applications needing follow-up with snooze, company logos, and draft triggers
 */
import React, { useState } from 'react';
import { PendingFollowUp } from '../types/followup.types.js';
import { Clock, Send, BellOff, CheckCircle, ArrowRight } from 'lucide-react';
import { CompanyLogo } from '../../../components/ui/CompanyLogo.js';

interface FollowUpRadarViewProps {
  pendingFollowUps: PendingFollowUp[];
  onOpenDraft: (applicationId: string, companyName: string, roleTitle: string) => void;
  onDismiss: (applicationId: string) => void;
  onNavigateToBoard?: () => void;
}

export const FollowUpRadarView: React.FC<FollowUpRadarViewProps> = ({
  pendingFollowUps,
  onOpenDraft,
  onDismiss,
  onNavigateToBoard
}) => {
  const [snoozeToast, setSnoozeToast] = useState<string | null>(null);

  const handleSnooze = (item: PendingFollowUp) => {
    onDismiss(item.applicationId);
    setSnoozeToast(`Snoozed follow-up for ${item.companyName} by 7 days`);
    setTimeout(() => setSnoozeToast(null), 3000);
  };

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

      {snoozeToast && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent)',
            fontSize: '0.82rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BellOff size={15} />
          <span>{snoozeToast}</span>
        </div>
      )}

      {pendingFollowUps.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <CheckCircle size={40} style={{ color: 'var(--stage-offer)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            All caught up! 🎉
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 16px' }}>
            No dormant applications require attention right now. All your job applications remain safely tracked on your Kanban Board.
          </p>
          {onNavigateToBoard && (
            <button
              onClick={onNavigateToBoard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Back to Kanban Board</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingFollowUps.map((item) => (
            <div
              key={item.applicationId}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CompanyLogo companyName={item.companyName} size={36} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {item.roleTitle}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleSnooze(item)}
                  title="Snooze reminder for 7 days"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                >
                  <BellOff size={13} />
                  <span>Snooze 7d</span>
                </button>

                <button
                  onClick={() => {
                    const targetId = item.applicationId || (item as any).id;
                    onOpenDraft(targetId, item.companyName, item.roleTitle);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '8px',
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
