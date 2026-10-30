/**
 * Universal Calendar Dropdown Modal / Popover
 * Clean, minimalist selector for Google Calendar, Apple Calendar, Outlook, and iCal download
 */
import React, { useRef, useEffect } from 'react';
import {
  CalendarEventDetails,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile
} from '../../../utils/calendar.utils.js';
import { ExternalLink, Download, X } from 'lucide-react';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventDetails;
  companyName: string;
}

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  isOpen,
  onClose,
  event,
  companyName
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogle = () => {
    const url = getGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleOutlook = () => {
    const url = getOutlookCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleAppleIcs = () => {
    const safeName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadIcsFile(event, `${safeName}_deadline.ics`);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          padding: '18px 20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Add to Calendar
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select your preferred calendar app
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Event Preview Pill */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {event.title}
          </div>
          <div>
            ⏰ {event.startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
            {event.startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Calendar Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Google Calendar */}
          <button
            onClick={handleGoogle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔵</span>
              <span>Google Calendar</span>
            </div>
            <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Apple Calendar */}
          <button
            onClick={handleAppleIcs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>🍎</span>
              <span>Apple Calendar (iOS / Mac)</span>
            </div>
            <Download size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Microsoft Outlook */}
          <button
            onClick={handleOutlook}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔷</span>
              <span>Microsoft Outlook</span>
            </div>
            <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Download Universal .ics */}
          <button
            onClick={handleAppleIcs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>💾</span>
              <span>Download iCal / .ics file</span>
            </div>
            <Download size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
