/**
 * Applications List View Component
 * Linear-style clean tabular list view of all tracked applications
 * Includes Multi-select checkboxes and 1-Click Batch/Bulk Deletion
 */
import React, { useState } from 'react';
import { Application } from '../types/application.types.js';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, Building2, Trash2, CheckSquare } from 'lucide-react';

interface ApplicationsListViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onArchive?: (id: string) => void;
  onBatchArchive?: (ids: string[]) => void;
}

export const ApplicationsListView: React.FC<ApplicationsListViewProps> = ({
  applications,
  onSelectApplication,
  onArchive,
  onBatchArchive
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (applications.length === 0) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem'
        }}
      >
        <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No applications found</p>
        <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
          Add your first application with "+ New Application" or connect your Gmail account.
        </p>
      </div>
    );
  }

  const allSelected = applications.length > 0 && selectedIds.size === applications.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to delete/archive ${count} selected application${count !== 1 ? 's' : ''}?`)) {
      return;
    }

    const ids = Array.from(selectedIds);
    if (onBatchArchive) {
      onBatchArchive(ids);
    } else if (onArchive) {
      ids.forEach((id) => onArchive(id));
    }
    setSelectedIds(new Set());
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--stage-rejected)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--stage-rejected)' }} />
            P1 • High
          </span>
        );
      case 'MEDIUM':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--stage-oa)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--stage-oa)' }} />
            P2 • Medium
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
            P3 • Low
          </span>
        );
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'OFFER':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--stage-offer)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>Offer</span>;
      case 'INTERVIEW':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--stage-interview)', backgroundColor: 'rgba(6, 182, 212, 0.12)' }}>Interview</span>;
      case 'OA_TEST':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--stage-oa)', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>OA / Test</span>;
      case 'REJECTED':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--stage-rejected)', backgroundColor: 'rgba(244, 63, 94, 0.12)' }}>Rejected</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--stage-applied)', backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>Applied</span>;
    }
  };

  return (
    <div style={{ padding: '16px', overflowX: 'hidden' }}>
      {/* Floating Bulk Action Bar when 1+ applications selected */}
      {selectedIds.size > 0 && (
        <div
          style={{
            marginBottom: '14px',
            padding: '10px 18px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
              <span>{selectedIds.size} of {applications.length} selected</span>
            </div>

            {!allSelected && (
              <button
                onClick={toggleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Select all {applications.length}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>

            <button
              onClick={handleBatchDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--stage-rejected)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.25)'
              }}
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              {/* Select All Checkbox */}
              <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  style={{
                    cursor: 'pointer',
                    accentColor: 'var(--accent)',
                    width: '15px',
                    height: '15px'
                  }}
                  title={allSelected ? 'Deselect all' : 'Select all'}
                />
              </th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Company & Role</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Priority</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Location & Comp</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applied Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Recruiter Activity</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const appliedDate = new Date(app.appliedDate);
              const daysAgo = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = !app.hasReply && daysAgo >= 7 && app.status === 'APPLIED';
              const isSelected = selectedIds.has(app.id);

              return (
                <tr
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Row Checkbox */}
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(app.id);
                    }}
                    style={{ padding: '12px 14px', textAlign: 'center', width: '40px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        // handled by td onClick to avoid double triggers
                      }}
                      style={{
                        cursor: 'pointer',
                        accentColor: 'var(--accent)',
                        width: '16px',
                        height: '16px',
                        pointerEvents: 'none'
                      }}
                    />
                  </td>

                  {/* Company & Role */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                        {app.companyName}
                      </span>
                      {app.companyDomain && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          @{app.companyDomain}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                      <span>{app.roleTitle}</span>
                      {app.notes && app.notes.startsWith('Source: ') && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {app.notes.replace('Source: ', '')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {getStatusPill(app.status)}
                      {app.stageDueDate && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.68rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Clock size={10} style={{ opacity: 0.7 }} />
                          Due {new Date(app.stageDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '12px 16px' }}>
                    {getPriorityBadge(app.priority)}
                  </td>

                  {/* Location & Salary */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    <div>{app.location || 'Remote'}</div>
                    {app.salaryRange && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                        {app.salaryRange}
                      </div>
                    )}
                  </td>

                  {/* Applied Date */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{daysAgo}d ago</div>
                  </td>

                  {/* Recruiter Activity */}
                  <td style={{ padding: '12px 16px' }}>
                    {app.hasReply ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--stage-offer)',
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Replied
                      </span>
                    ) : isOverdue ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--stage-rejected)',
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}
                      >
                        <AlertCircle size={13} />
                        Overdue ({daysAgo}d)
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--text-muted)',
                          fontSize: '0.74rem'
                        }}
                      >
                        <Clock size={13} />
                        Awaiting reply
                      </span>
                    )}
                  </td>

                  {/* Actions (Delete/Archive & Chevron Right) */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {onArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchive(app.id);
                          }}
                          title="Delete / Archive application"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--stage-rejected)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsListView;
