/**
 * Kanban Board Component
 * Linear-inspired minimal horizontal multi-column board with drag-and-drop state updates
 */
import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../applications/types/application.types.js';
import { KanbanColumn } from './KanbanColumn.js';

interface KanbanBoardProps {
  applications: Application[];
  onCardClick: (app: Application) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onArchive?: (id: string) => void;
}

const COLUMNS: Array<{ id: ApplicationStatus; title: string; colorVar: string }> = [
  { id: 'APPLIED', title: 'Applied', colorVar: 'var(--stage-applied)' },
  { id: 'OA_TEST', title: 'OA / Assessment', colorVar: 'var(--stage-oa)' },
  { id: 'INTERVIEW', title: 'Interview', colorVar: 'var(--stage-interview)' },
  { id: 'OFFER', title: 'Offer', colorVar: 'var(--stage-offer)' },
  { id: 'REJECTED', title: 'Rejected', colorVar: 'var(--stage-rejected)' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onCardClick,
  onStatusChange,
  onArchive
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [mobileSelectedStage, setMobileSelectedStage] = useState<ApplicationStatus | 'ALL'>('ALL');

  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
  };

  const handleDrop = (_e: React.DragEvent, targetStatus: ApplicationStatus) => {
    if (!draggedAppId) return;

    const currentApp = applications.find((a) => a.id === draggedAppId);
    if (currentApp && currentApp.status !== targetStatus) {
      onStatusChange(draggedAppId, targetStatus);
    }
    setDraggedAppId(null);
  };

  const displayedColumns = mobileSelectedStage === 'ALL'
    ? COLUMNS
    : COLUMNS.filter((col) => col.id === mobileSelectedStage);

  return (
    <div>
      {/* Mobile Stage Selector Pill Strip */}
      <div
        className="mobile-only"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          type="button"
          onClick={() => setMobileSelectedStage('ALL')}
          style={{
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            backgroundColor: mobileSelectedStage === 'ALL' ? 'var(--accent)' : 'var(--bg-surface)',
            color: mobileSelectedStage === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          All ({applications.length})
        </button>
        {COLUMNS.map((col) => {
          const count = applications.filter((a) => a.status === col.id).length;
          const isSelected = mobileSelectedStage === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileSelectedStage(col.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{col.title}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  fontSize: '0.66rem',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Columns Container */}
      <div
        className="kanban-scroll-container"
        style={{
          minHeight: 'calc(100vh - 120px)',
          alignItems: 'flex-start'
        }}
      >
        {displayedColumns.map((col) => {
          const colApps = applications
            .filter((app) => app.status === col.id)
            .sort((a, b) => {
              const timeA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
              const timeB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
              return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
            });
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              accentColor={col.colorVar}
              applications={colApps}
              onCardClick={onCardClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onArchive={onArchive}
            />
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
