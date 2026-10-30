/**
 * Universal Calendar Dropdown Modal / Popover
 * Clean, minimalist selector for Google Calendar, Apple Calendar, Outlook, and iCal download.
 * Uses createPortal(document.body) to guarantee proper viewport stacking above Kanban DND layers.
 */
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarEventDetails,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile
} from '../../../utils/calendar.utils.js';
import { ExternalLink, Download, X, Calendar, Bell } from 'lucide-react';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventDetails;
  companyName: string;
}

/**
 * High-fidelity Google Calendar Logo (Matches Official Workspace 31 Icon)
 */
const GoogleCalendarLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
  >
    {/* Blue Background Base */}
    <rect width="64" height="64" rx="14" fill="#1A73E8" />
    {/* Yellow Right Section */}
    <path d="M44 18H64V46L44 64V18Z" fill="#FBBC04" />
    {/* Green Bottom Section */}
    <path d="M0 46H44V64H14C6.268 64 0 57.732 0 50V46Z" fill="#1E8E3E" />
    {/* Red Fold Corner */}
    <path d="M44 46H64L44 64V46Z" fill="#EA4335" />
    {/* White Inner Card */}
    <rect x="21" y="18" width="23" height="28" rx="2" fill="#FFFFFF" />
    {/* 31 Date Number */}
    <text
      x="32.5"
      y="38.5"
      textAnchor="middle"
      fill="#1A73E8"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
      fontSize="17"
      fontWeight="700"
      letterSpacing="-0.5px"
    >
      31
    </text>
  </svg>
);

/**
 * High-fidelity Apple Calendar Logo (Matches iOS / macOS Native Icon)
 */
const AppleCalendarLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
  >
    {/* White Rounded Card */}
    <rect width="64" height="64" rx="14" fill="#FFFFFF" stroke="rgba(0, 0, 0, 0.12)" strokeWidth="1.5" />
    {/* Red Weekday Header */}
    <text
      x="32"
      y="21"
      textAnchor="middle"
      fill="#FF3B30"
      fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif"
      fontSize="11"
      fontWeight="600"
      letterSpacing="-0.2px"
    >
      MON
    </text>
    {/* Date Number */}
    <text
      x="32"
      y="49"
      textAnchor="middle"
      fill="#1C1C1E"
      fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif"
      fontSize="27"
      fontWeight="300"
    >
      17
    </text>
  </svg>
);

/**
 * Microsoft Outlook Logo
 */
const OutlookLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
  >
    <rect width="64" height="64" rx="14" fill="#0078D4" />
    <path d="M28 14H50C54.418 14 58 17.582 58 22V42C58 46.418 54.418 50 50 50H28V14Z" fill="#106EBE" />
    <rect x="7" y="16" width="30" height="32" rx="6" fill="#0078D4" stroke="#2886DE" strokeWidth="1" />
    <text
      x="22"
      y="38.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif"
      fontSize="20"
      fontWeight="700"
    >
      O
    </text>
  </svg>
);

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

  // Render via React Portal to document.body so transform on parent Kanban card does not trap modal
  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          padding: '20px 22px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Add to Calendar
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Select your preferred calendar app
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background-color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Event Preview Pill */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>
            {event.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
            <span>📅 {event.startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>⏰ {event.startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              color: 'var(--accent)',
              fontSize: '0.70rem',
              fontWeight: 500
            }}
          >
            <Bell size={11} />
            <span>Pre-configured with T-24h & T-6h reminders</span>
          </div>
        </div>

        {/* Calendar Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Google Calendar */}
          <button
            onClick={handleGoogle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GoogleCalendarLogo size={32} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Google Calendar
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Opens directly in Google Calendar web / app
                </div>
              </div>
            </div>
            <ExternalLink size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {/* Apple Calendar */}
          <button
            onClick={handleAppleIcs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AppleCalendarLogo size={32} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Apple Calendar (iOS / Mac)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Triggers native iPhone / Mac sheet with alarms
                </div>
              </div>
            </div>
            <Download size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {/* Microsoft Outlook */}
          <button
            onClick={handleOutlook}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <OutlookLogo size={32} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Microsoft Outlook
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Opens in Outlook Live / Office 365
                </div>
              </div>
            </div>
            <ExternalLink size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {/* Download Universal .ics */}
          <button
            onClick={handleAppleIcs}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px dashed var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: '2px',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0
                }}
              >
                💾
              </div>
              <div>
                <div style={{ fontSize: '0.80rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Download .ics file
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Universal format for Thunderbird, Proton, etc.
                </div>
              </div>
            </div>
            <Download size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default CalendarPickerModal;
