/**
 * AnalyticsView Component
 * Desktop Web adaptation of Cal AI Job Application Tracker Stats & Follow-up Reminders
 */
import React from 'react';
import { Application } from '../../applications/types/application.types.js';
import { PendingFollowUp } from '../../followups/types/followup.types.js';
import { 
  Briefcase, 
  MessageSquare, 
  Award, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsViewProps {
  applications: Application[];
  pendingFollowUps: PendingFollowUp[];
  onOpenDraft: (appId: string, company: string, role: string) => void;
  onNavigateToBoard: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  applications,
  pendingFollowUps,
  onOpenDraft,
  onNavigateToBoard
}) => {
  // 1. Metric Calculations
  const totalApplied = applications.length;
  const repliesCount = applications.filter((a) => a.hasReply).length;
  const replyRate = totalApplied > 0 ? Math.round((repliesCount / totalApplied) * 100) : 0;

  const appliedCount = applications.filter((a) => a.status === 'APPLIED').length;
  const oaCount = applications.filter((a) => a.status === 'OA_TEST').length;
  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
  const offerCount = applications.filter((a) => a.status === 'OFFER').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  const inProgressCount = oaCount + interviewCount;

  // Calculate applications this week (last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekCount = applications.filter(
    (a) => new Date(a.appliedDate).getTime() >= oneWeekAgo
  ).length;

  // 2. Weekly Velocity (Past 6 Weeks)
  const weeksData = React.useMemo(() => {
    const weeks: Array<{ label: string; count: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const count = applications.filter((a) => {
        const d = new Date(a.appliedDate).getTime();
        return d >= start.getTime() && d < end.getTime();
      }).length;

      weeks.push({ label, count });
    }
    return weeks;
  }, [applications]);

  const maxWeeklyCount = Math.max(...weeksData.map((w) => w.count), 4);

  // 3. Donut Chart Calculation
  const statusBreakdown = [
    { label: 'Applied', count: appliedCount, color: 'var(--stage-applied)' },
    { label: 'Interview & OA', count: inProgressCount, color: 'var(--stage-interview)' },
    { label: 'Rejected', count: rejectedCount, color: 'var(--stage-rejected)' },
    { label: 'Offer', count: offerCount, color: 'var(--stage-offer)' }
  ];

  const totalStatusCount = statusBreakdown.reduce((sum, item) => sum + item.count, 0);

  // SVG Donut Path Builder
  let cumulativePercent = 0;
  const donutSlices = statusBreakdown.map((item) => {
    const percent = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 25;
    const strokeDasharray = `${percent} ${100 - percent}`;
    const strokeDashoffset = -cumulativePercent;
    cumulativePercent += percent;
    return {
      ...item,
      percent: Math.round(percent),
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Pipeline Stats & Analytics
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cal AI real-time tracking performance, conversion velocity, and follow-up reminders.
          </p>
        </div>

        <button
          onClick={onNavigateToBoard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <span>Open Kanban Board</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Row 1: KPI Metric Cards (Cal AI Style) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Total Applied */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Briefcase size={16} />
            <span>Total Applied</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {totalApplied}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--stage-offer)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <TrendingUp size={12} />
            <span>+{thisWeekCount} this week</span>
          </div>
        </div>

        {/* Reply Rate */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <MessageSquare size={16} />
            <span>Reply Rate</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {replyRate}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {repliesCount} recruiter response{repliesCount !== 1 ? 's' : ''} detected
          </div>
        </div>

        {/* In Progress */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Calendar size={16} />
            <span>In Process (OA / Screen)</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stage-interview)', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {oaCount} assessment{oaCount !== 1 ? 's' : ''} • {interviewCount} interview{interviewCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Offers */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Award size={16} style={{ color: 'var(--stage-offer)' }} />
            <span>Offers Received</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stage-offer)', margin: '8px 0 4px', letterSpacing: '-0.03em' }}>
            {offerCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {totalApplied > 0 ? `${Math.round((offerCount / totalApplied) * 100)}% conversion` : 'Pending offers'}
          </div>
        </div>
      </div>

      {/* Row 2: Charts Side by Side (Status Donut + Velocity Bars) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Applications by Status (Donut Chart) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Applications by Status
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', minHeight: '190px' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--border-color)" strokeWidth="6" />
                {totalStatusCount > 0 ? (
                  donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="6"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                  ))
                ) : (
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--border-color)" strokeWidth="6" />
                )}
              </svg>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {totalApplied}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {statusBreakdown.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', minWidth: '110px' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.count}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applications Over Time (Bar Chart) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Applications Over Time
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Weekly cadence</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '160px',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            {weeksData.map((week, idx) => {
              const heightPercent = maxWeeklyCount > 0 ? (week.count / maxWeeklyCount) * 100 : 0;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: week.count > 0 ? 'var(--text-primary)' : 'transparent' }}>
                    {week.count}
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: `${Math.max(heightPercent, 4)}%`,
                      maxHeight: '120px',
                      borderRadius: '5px 5px 0 0',
                      backgroundColor: week.count > 0 ? 'var(--accent)' : 'var(--border-color)',
                      transition: 'height 0.3s ease'
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            {weeksData.map((week, idx) => (
              <span key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {week.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Actionable Follow-Up Reminders (Cal AI Style) */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={17} style={{ color: 'var(--stage-oa)' }} />
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Follow-Up Reminders
            </h3>
            {pendingFollowUps.length > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--stage-oa)',
                  color: '#0f172a',
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}
              >
                {pendingFollowUps.length} Pending
              </span>
            )}
          </div>
        </div>

        {pendingFollowUps.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.84rem'
            }}
          >
            No follow-ups due right now. Every application is currently on schedule!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingFollowUps.map((item) => {
              const appliedDate = new Date(item.appliedDate);
              const daysAgo = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={item.applicationId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--stage-oa)'
                      }}
                    >
                      <Clock size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Follow up with {item.companyName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: daysAgo >= 7 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: daysAgo >= 7 ? 'var(--stage-rejected)' : 'var(--stage-oa)'
                          }}
                        >
                          {daysAgo >= 7 ? 'Overdue' : 'Due today'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.roleTitle} • Sent {daysAgo} days ago ({appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenDraft(item.applicationId, item.companyName, item.roleTitle)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Generate Draft</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;
