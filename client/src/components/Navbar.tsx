/**
 * Main Top Navigation Bar
 * View switcher pills, search input, and quick actions matching Image 1
 */
import React from 'react';
import { User } from '../features/auth/types/auth.types.js';
import { ActiveNavView } from './Sidebar.js';
import {
  Trello,
  ListFilter,
  BarChart3,
  Clock,
  Plus,
  Search,
  RotateCw,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

interface NavbarProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  pendingFollowUpsCount: number;
  totalApplicationsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNewModal: () => void;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSyncGmail?: () => void;
  isSyncing?: boolean;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  pendingFollowUpsCount,
  totalApplicationsCount: _totalApplicationsCount,
  searchQuery,
  setSearchQuery,
  onOpenNewModal,
  user,
  onOpenLogin,
  onSyncGmail,
  isSyncing = false,
  onOpenProfile
}) => {
  const { theme, toggleTheme } = useTheme();

  const views: Array<{ id: ActiveNavView; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'board', label: 'Board', icon: Trello },
    { id: 'list', label: 'List', icon: ListFilter },
    { id: 'analytics', label: 'Stats & Insights', icon: BarChart3 },
    { id: 'radar', label: 'Radar', icon: Clock, badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined }
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        height: '60px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}
    >
      {/* 1. Mobile Brand Indicator (Visible <= 768px) */}
      <div className="mobile-only" style={{ alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}
        >
          <Briefcase size={15} />
        </div>
        <span style={{ fontSize: '0.96rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          ApplyTrack
        </span>
      </div>

      {/* 2. Desktop View Switcher Pills (Hidden on Mobile) */}
      <div
        className="desktop-only"
        style={{
          alignItems: 'center',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-color)'
        }}
      >
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;

          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              <Icon size={14} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
              <span>{v.label}</span>
              {v.badge && (
                <span
                  style={{
                    backgroundColor: 'var(--stage-oa)',
                    color: '#0f172a',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0 5px'
                  }}
                >
                  {v.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Controls: Search, Theme Toggle, Sync Gmail, Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search Bar (Desktop / Tablet) */}
        <div
          className="desktop-only"
          style={{
            position: 'relative',
            alignItems: 'center',
            width: '240px'
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
        </div>

        {/* Theme Switcher Toggle (Essential for mobile users) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '7px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} />}
        </button>

        {/* Sync Gmail Button */}
        <button
          onClick={user?.hasGoogleLinked ? onSyncGmail : onOpenLogin}
          disabled={isSyncing}
          title={user?.hasGoogleLinked ? 'Scan Gmail for new applications' : 'Connect Google account'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 10px',
            borderRadius: '7px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            opacity: isSyncing ? 0.7 : 1,
            transition: 'background-color 0.12s ease'
          }}
        >
          <RotateCw
            size={13}
            style={{
              color: user?.hasGoogleLinked ? 'var(--stage-offer)' : 'var(--text-muted)',
              animation: isSyncing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span className="desktop-only">{isSyncing ? 'Syncing...' : user?.hasGoogleLinked ? 'Sync Gmail' : 'Connect Gmail'}</span>
          <span className="mobile-only">{isSyncing ? '...' : 'Sync'}</span>
        </button>

        {/* Primary Action Button (Desktop) */}
        <button
          onClick={onOpenNewModal}
          className="desktop-only"
          style={{
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 12px',
            borderRadius: '7px',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background-color 0.12s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <Plus size={15} />
          <span>New</span>
        </button>

        {/* User Avatar / Profile Popover Trigger */}
        {user ? (
          <button
            onClick={onOpenProfile}
            title={`${user.fullName || user.email} • Click to open AI Context Profile`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              height: '34px',
              padding: '0 8px 0 3px',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User'}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.74rem'
                }}
              >
                {(user.fullName || user.email)[0].toUpperCase()}
              </div>
            )}
            <span
              className="desktop-only"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user.fullName ? user.fullName.split(' ')[0] : 'Profile'}
            </span>
            {user.hasGoogleLinked && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--stage-offer)'
                }}
                title="Gmail Sync Active"
              />
            )}
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            style={{
              height: '34px',
              padding: '0 10px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
