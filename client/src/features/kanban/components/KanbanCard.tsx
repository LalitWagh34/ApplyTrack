/**
 * Kanban Card Component
 * Linear-inspired minimal card with drag handle, status badges, and overdue follow-up indicators
 */
import React, { useState } from 'react';
import { Application } from '../../applications/types/application.types.js';
import { MapPin, DollarSign, Clock, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { CalendarPickerModal } from './CalendarPickerModal.js';
import { CompanyLogo } from '../../../components/ui/CompanyLogo.js';

interface KanbanCardProps {
  application: Application;
  onClick: (app: Application) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onArchive?: (id: string, e: React.MouseEvent) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  application,
  onClick,
  onDragStart,
  onArchive
}) => {
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const isOverdue =
    application.nextFollowUpDate &&
    new Date(application.nextFollowUpDate) <= new Date() &&
    !application.hasReply &&
    application.status !== 'OFFER' &&
    application.status !== 'REJECTED';

  const formatDueDate = (dateStr: string, status: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Due soon';
      const formatted = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      return status === 'INTERVIEW' ? `Interview ${formatted}` : `Due ${formatted}`;
    } catch {
      return 'Due date set';
    }
  };

  const formatRelativeDate = (dateStr: string) => {
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, application.id)}
      onClick={() => onClick(application)}
      className="card-hover"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '14px',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Top Header: Company Name & Overdue Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <CompanyLogo
            companyName={application.companyName}
            domain={application.companyDomain}
            size={22}
          />
          <h4
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {application.companyName}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOverdue && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--stage-oa)',
                border: '1px solid var(--stage-oa)'
              }}
              title="7+ days without reply. Follow-up recommended!"
            >
              <AlertCircle size={11} />
              Follow-up
            </span>
          )}

          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(application.id, e);
              }}
              title="Delete / Archive card"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.12s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--stage-rejected)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Role Title */}
      <p
        style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          marginTop: '4px',
          fontWeight: 400
        }}
      >
        {application.roleTitle}
      </p>

      {/* Meta Pills (Domain, Due Date, Source, Location, Salary) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
        {application.stageDueDate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCalendarPickerOpen(true);
            }}
            title="Click to add deadline to Google Calendar or Apple Calendar (.ics)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          >
            <Calendar size={10} />
            <span>{formatDueDate(application.stageDueDate, application.status)}</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.65, marginLeft: '2px' }}>📅+</span>
          </button>
        )}

        {application.companyDomain && (
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              color: 'var(--accent)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.68rem',
              fontWeight: 500
            }}
          >
            @{application.companyDomain}
          </span>
        )}

        {application.notes && application.notes.startsWith('Source: ') && (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.68rem'
            }}
          >
            {application.notes.replace('Source: ', '')}
          </span>
        )}

        {application.location && (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <MapPin size={10} />
            {application.location}
          </span>
        )}

        {application.salaryRange && (
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <DollarSign size={10} />
            {application.salaryRange}
          </span>
        )}
      </div>

      {/* Footer Info: Applied Date & Follow-up countdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.74rem',
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          {formatRelativeDate(application.appliedDate)}
        </span>

        {application.hasReply ? (
          <span style={{ color: 'var(--stage-offer)', fontWeight: 500 }}>
            Replied
          </span>
        ) : application.followUpCount > 0 ? (
          <span>{application.followUpCount} sent</span>
        ) : null}
      </div>

      {/* Calendar Picker Modal */}
      {application.stageDueDate && (
        <CalendarPickerModal
          isOpen={isCalendarPickerOpen}
          onClose={() => setIsCalendarPickerOpen(false)}
          companyName={application.companyName}
          event={{
            title: `[${application.status === 'INTERVIEW' ? 'Interview' : 'OA Due'}] ${application.roleTitle} at ${application.companyName}`,
            description: `Application details:\nCompany: ${application.companyName}\nRole: ${application.roleTitle}\nStatus: ${application.status}\n${application.jobUrl ? `Job Link: ${application.jobUrl}\n` : ''}${application.notes ? `Notes: ${application.notes}` : ''}`,
            startDate: new Date(application.stageDueDate),
            durationMinutes: application.status === 'INTERVIEW' ? 60 : 120
          }}
        />
      )}
    </div>
  );
};

export default KanbanCard;
