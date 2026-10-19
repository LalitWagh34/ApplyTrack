/**
 * Kanban Column Component
 * Color-coded stage header, card container, and drop-target listener
 */
import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../applications/types/application.types.js';
import { KanbanCard } from './KanbanCard.js';

interface KanbanColumnProps {
  id: ApplicationStatus;
  title: string;
  accentColor: string;
  applications: Application[];
  onCardClick: (app: Application) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetStatus: ApplicationStatus) => void;
  onArchive?: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  accentColor,
  applications,
  onCardClick,
  onDragStart,
  onDrop,
  onArchive
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, id);
  };

  return (
    <div
      className="kanban-scroll-column"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '320px',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-subtle)',
        border: `1px solid ${isDragOver ? accentColor : 'var(--border-color)'}`,
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accentColor
            }}
          />
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h3>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-subtle)',
            padding: '2px 8px',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)'
          }}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards Scrollable Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {applications.map((app) => (
          <KanbanCard
            key={app.id}
            application={app}
            onClick={onCardClick}
            onDragStart={onDragStart}
            onArchive={onArchive ? (id) => onArchive(id) : undefined}
          />
        ))}

        {applications.length === 0 && (
          <div
            style={{
              padding: '30px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '1px dashed var(--border-color)',
              borderRadius: '6px'
            }}
          >
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
