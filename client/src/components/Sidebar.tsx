/**
 * Sidebar Navigation Component
 * Linear / Meta style desktop workspace sidebar with deep midnight slate aesthetic
 */
import React from 'react';
import { 
  Trello, 
  ListFilter, 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  LogIn, 
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { User } from '../features/auth/types/auth.types.js';
import { useTheme } from '../context/ThemeContext.js';

export type ActiveNavView = 'board' | 'list' | 'analytics' | 'radar';

interface SidebarProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  pendingFollowUpsCount: number;
  totalApplicationsCount: number;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  selectedPriority: string | null;
  setSelectedPriority: (priority: string | null) => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  pendingFollowUpsCount,
  totalApplicationsCount,
  user,
  onOpenLogin,
  onLogout,
  selectedPriority,
  setSelectedPriority,
  onOpenProfile
}) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'board' as ActiveNavView,
      label: 'Pipeline (Board)',
      icon: Trello,
      badge: totalApplicationsCount > 0 ? String(totalApplicationsCount) : undefined
    },
    {
      id: 'list' as ActiveNavView,
      label: 'Applications (List)',
      icon: ListFilter
    },
    {
      id: 'analytics' as ActiveNavView,
      label: 'Stats & Insights',
      icon: BarChart3
    },
    {
      id: 'radar' as ActiveNavView,
      label: 'Follow-Up Radar',
      icon: Clock,
      badge: pendingFollowUpsCount > 0 ? String(pendingFollowUpsCount) : undefined,
      badgeColor: 'var(--stage-oa)'
    }
  ];

  const priorityFilters = [
    { id: null, label: 'All Applications', color: '#94a3b8' },
    { id: 'HIGH', label: 'P1 • High Priority', color: 'var(--stage-rejected)' },
    { id: 'MEDIUM', label: 'P2 • Medium', color: 'var(--stage-oa)' },
    { id: 'LOW', label: 'P3 • Low', color: 'var(--stage-applied)' }
  ];

  return (
    <aside
      className="desktop-only"
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        userSelect: 'none'
      }}
    >
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div
          style={{
            height: '60px',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
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
              color: 'var(--accent)'
            }}
          >
            <Briefcase size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.96rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              ApplyTrack
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Cal AI Tracker
            </span>
          </div>
        </div>

        {/* WORKSPACE Navigation */}
        <div style={{ padding: '16px 12px 8px' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 8px 8px'
            }}
          >
            Workspace
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Icon size={16} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: item.badgeColor || 'var(--border-color)',
                        color: item.badgeColor ? '#0f172a' : 'var(--text-primary)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* FILTER BY PRIORITY */}
        <div style={{ padding: '14px 12px 8px' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 8px 8px'
            }}
          >
            Priority Filter
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {priorityFilters.map((p) => {
              const isSelected = selectedPriority === p.id;
              return (
                <button
                  key={String(p.id)}
                  onClick={() => setSelectedPriority(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--bg-subtle)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: p.color
                    }}
                  />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Sync Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
            padding: '4px 6px',
            borderRadius: '5px',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          {user?.hasGoogleLinked ? (
            <>
              <CheckCircle2 size={13} style={{ color: 'var(--stage-offer)' }} />
              <span>Gmail Live Sync</span>
            </>
          ) : (
            <>
              <ShieldCheck size={13} style={{ color: 'var(--stage-applied)' }} />
              <span>Cloud PostgreSQL</span>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'dark' ? 'Midnight Theme' : 'Light Slate'}</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Toggle</span>
        </button>

        {/* User Auth Section */}
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-subtle)'
            }}
          >
            <div
              onClick={onOpenProfile}
              title="Click to view AI Context & Resume"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', cursor: 'pointer', flex: 1 }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User'}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {(user.fullName || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px'
                }}
              >
                {user.fullName || user.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--stage-rejected)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};
