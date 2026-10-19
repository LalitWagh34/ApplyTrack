/**
 * Follow-Up Radar Banner
 * Subtle, non-intrusive notification strip alerting user about dormant threads
 */
import React from 'react';
import { PendingFollowUp } from '../types/followup.types.js';
import { Clock, ArrowRight } from 'lucide-react';

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
  if (pendingFollowUps.length === 0) return null;

  const topItem = pendingFollowUps[0];

  return (
    <div
      style={{
        margin: '12px 24px 0',
        padding: '10px 16px',
        borderRadius: '8px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={16} style={{ color: 'var(--stage-oa)' }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {pendingFollowUps.length === 1 ? (
            <>
              <strong>{topItem.companyName}</strong> has not replied in 7+ days.
            </>
          ) : (
            <>
              You have <strong>{pendingFollowUps.length} applications</strong> awaiting follow-up.
            </>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onOpenDraft(topItem.applicationId, topItem.companyName, topItem.roleTitle)}
          style={{
            padding: '4px 10px',
            borderRadius: '5px',
            backgroundColor: 'var(--stage-oa)',
            color: '#0f172a',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Draft for {topItem.companyName}
        </button>

        {pendingFollowUps.length > 1 && (
          <button
            onClick={onOpenRadarView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '5px',
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
      </div>
    </div>
  );
};

export default FollowUpBanner;
