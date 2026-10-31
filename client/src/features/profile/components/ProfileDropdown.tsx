/**
 * ProfileDropdown Component
 * Linear / Expense Tracker inspired Quick Profile Card
 * Appears on clicking user avatar: shows account snapshot with Edit Profile & Sign Out buttons
 */
import React, { useEffect, useRef } from 'react';
import { User } from '../../auth/types/auth.types.js';
import { UserCheck, LogOut, Sparkles } from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  user,
  onEditProfile,
  onLogout
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user.fullName || 'Candidate Profile';
  const displayEmail = user.email;
  const initial = (user.fullName || user.email || 'U')[0].toUpperCase();

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0',
        zIndex: 100,
        width: '310px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '18px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.12)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'profileDropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'top right'
      }}
    >
      {/* 1. User Snapshot Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 14px',
          borderRadius: '14px',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-color)',
              flexShrink: 0
            }}
          />
        ) : (
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
            }}
          >
            {initial}
          </div>
        )}

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '0.96rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em'
            }}
          >
            {displayName}
          </h4>
          <p
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              margin: '2px 0 6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayEmail}
          </p>

          {/* Active Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                fontWeight: 600,
                color: '#16a34a',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a'
                }}
              />
              Active Account
            </span>

            {user.hasGoogleLinked && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Sparkles size={9} style={{ color: 'var(--stage-oa)' }} />
                Gmail Synced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Action Buttons (Matching Reference Image 2 Style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Primary Solid Green Button: Edit Profile */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onEditProfile();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: '12px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.14s ease',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
        >
          <UserCheck size={16} />
          <span>Edit Profile</span>
        </button>

        {/* Secondary Light Red Button: Sign Out */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            color: '#e11d48',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.14s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
          }}
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
