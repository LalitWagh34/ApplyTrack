/**
 * Follow-Up Radar Banner
 * Subtle, non-intrusive notification strip alerting user about dormant threads
 * Features dismiss (X) capability and clear action labels
 */
import React, { useState } from 'react';
import { PendingFollowUp } from '../types/followup.types.js';
import { Clock, ArrowRight, X, Send } from 'lucide-react';
import { CompanyLogo } from '../../../components/ui/CompanyLogo.js';

interface FollowUpBannerProps {
  pendingFollowUps: PendingFollowUp[];
  onOpenRadarView: () => void;
  onOpenDraft: (applicationId: string, companyName: string, roleTitle: string) => void;
}

export const FollowUpBanner: React.FC<FollowUpBannerProps> = ({
  pendingFollowUps,
  onOpenRadarView,
  onOpenDraft
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('applytrack_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed || pendingFollowUps.length === 0) return null;

  const topItem = pendingFollowUps[0];

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('applytrack_banner_dismissed', 'true');
    } catch {
      // Ignored
    }
  };

  return (
    <div
      style={{
        margin: '12px 24px 0',
        padding: '10px 16px',
        borderRadius: '10px',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={16} style={{ color: 'var(--stage-oa)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {pendingFollowUps.length === 1 ? (
            <>
              Follow-up reminder: <strong>{topItem.companyName}</strong> has had no reply in 7+ days.
            </>
          ) : (
            <>
              You have <strong>{pendingFollowUps.length} applications</strong> awaiting follow-up.
            </>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Action Button */}
        <button
          onClick={() => onOpenDraft(topItem.applicationId, topItem.companyName, topItem.roleTitle)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--stage-oa)',
            color: '#0f172a',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.12s ease'
          }}
        >
          <CompanyLogo companyName={topItem.companyName} size={16} />
          <span>Follow-up with {topItem.companyName}</span>
        </button>

        {pendingFollowUps.length > 1 && (
          <button
            onClick={onOpenRadarView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.76rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <span>View All ({pendingFollowUps.length})</span>
            <ArrowRight size={12} />
          </button>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          title="Dismiss banner"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            marginLeft: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default FollowUpBanner;
