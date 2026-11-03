import React, { useMemo } from 'react';
import { AlertCircle, ArrowRight, CalendarClock, Clock3 } from 'lucide-react';
import { Application } from '../types/application.types.js';

interface ActionFirstDashboardProps {
  applications: Application[];
  onReviewFollowUps: () => void;
  onOpenPipeline: () => void;
  onAddApplication: () => void;
}

function startOfToday(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday(): Date {
  const value = startOfToday();
  value.setDate(value.getDate() + 1);
  return value;
}

function isTerminalStatus(application: Application): boolean {
  return application.status === 'OFFER' || application.status === 'REJECTED';
}

function isValidDate(value: string | null | undefined): value is string {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

export function ActionFirstDashboard({
  applications,
  onReviewFollowUps,
  onOpenPipeline,
  onAddApplication
}: ActionFirstDashboardProps) {
  const summary = useMemo(() => {
    const today = startOfToday();
    const tomorrow = endOfToday();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdueFollowUps = applications.filter((application) =>
      !isTerminalStatus(application)
      && !application.hasReply
      && isValidDate(application.nextFollowUpDate)
      && new Date(application.nextFollowUpDate) < today
    );
    const followUpsToday = applications.filter((application) =>
      !isTerminalStatus(application)
      && !application.hasReply
      && isValidDate(application.nextFollowUpDate)
      && new Date(application.nextFollowUpDate) >= today
      && new Date(application.nextFollowUpDate) < tomorrow
    );
    const upcomingInterviews = applications.filter((application) =>
      application.status === 'INTERVIEW'
      && isValidDate(application.stageDueDate)
      && new Date(application.stageDueDate) >= today
      && new Date(application.stageDueDate) < nextWeek
    );
    const stageDeadlines = applications.filter((application) =>
      (application.status === 'OA_TEST' || application.status === 'INTERVIEW')
      && isValidDate(application.stageDueDate)
      && new Date(application.stageDueDate) < tomorrow
    );
    const attentionIds = new Set([
      ...overdueFollowUps,
      ...followUpsToday,
      ...stageDeadlines
    ].map((application) => application.id));

    return {
      overdueFollowUps: overdueFollowUps.length,
      followUpsToday: followUpsToday.length,
      upcomingInterviews: upcomingInterviews.length,
      needsAttention: attentionIds.size
    };
  }, [applications]);

  const hasFollowUps = summary.overdueFollowUps + summary.followUpsToday > 0;
  const primaryAction = hasFollowUps
    ? { label: 'Review follow-ups', onClick: onReviewFollowUps }
    : summary.needsAttention > 0 || summary.upcomingInterviews > 0
      ? { label: 'Review pipeline', onClick: onOpenPipeline }
      : { label: 'Add application', onClick: onAddApplication };

  const metrics = [
    { label: 'Overdue follow-ups', value: summary.overdueFollowUps, icon: <AlertCircle size={15} />, color: 'var(--stage-rejected)' },
    { label: 'Follow-ups today', value: summary.followUpsToday, icon: <Clock3 size={15} />, color: 'var(--stage-oa)' },
    { label: 'Interviews in 7 days', value: summary.upcomingInterviews, icon: <CalendarClock size={15} />, color: 'var(--stage-interview)' },
    { label: 'Needs attention', value: summary.needsAttention, icon: <AlertCircle size={15} />, color: 'var(--accent)' }
  ];

  return (
    <section style={{ margin: '14px 20px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 520px', minWidth: 0, padding: '14px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next actions</p>
            <p style={{ marginTop: '3px', fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              {summary.needsAttention > 0 ? `${summary.needsAttention} application${summary.needsAttention === 1 ? '' : 's'} need attention.` : 'Your pipeline has no dated actions today.'}
            </p>
          </div>
          <button type="button" onClick={primaryAction.onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 11px', borderRadius: '7px', border: 'none', backgroundColor: 'var(--accent)', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
            {primaryAction.label}<ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div className="action-summary-metrics" style={{ flex: '2 1 540px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: '8px' }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: metric.color }}>
              {metric.icon}<span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{metric.label}</span>
            </div>
            <div style={{ marginTop: '6px', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 800 }}>{metric.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
