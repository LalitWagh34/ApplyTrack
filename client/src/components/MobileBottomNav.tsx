/**
 * Mobile Bottom Navigation Bar
 * Ultra-responsive thumb-friendly bottom nav for ApplyTrack Mobile
 * iOS / Android safe area inset aware • Linear Midnight Slate Design
 */
import React from 'react';
import { ActiveNavView } from './Sidebar.js';
import { Trello, ListFilter, BarChart3, Clock, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  pendingFollowUpsCount: number;
  onOpenNewModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  pendingFollowUpsCount,
  onOpenNewModal
}) => {
  return (
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 40,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingLeft: '6px',
        paddingRight: '6px'
      }}
    >
      {/* 1. Board Tab */}
      <button
        type="button"
        onClick={() => setActiveView('board')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: '6px 0',
          color: activeView === 'board' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <Trello size={20} strokeWidth={activeView === 'board' ? 2.4 : 1.8} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeView === 'board' ? 700 : 500 }}>
          Board
        </span>
      </button>

      {/* 2. List Tab */}
      <button
        type="button"
        onClick={() => setActiveView('list')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: '6px 0',
          color: activeView === 'list' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <ListFilter size={20} strokeWidth={activeView === 'list' ? 2.4 : 1.8} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeView === 'list' ? 700 : 500 }}>
          List
        </span>
      </button>

      {/* 3. Quick + New Action Button (Center Highlight) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onOpenNewModal}
          title="Track New Application"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)',
            cursor: 'pointer',
            transition: 'transform 0.12s ease',
            transform: 'translateY(-4px)'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(-4px) scale(1)')}
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>
      </div>

      {/* 4. Stats Tab */}
      <button
        type="button"
        onClick={() => setActiveView('analytics')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: '6px 0',
          color: activeView === 'analytics' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <BarChart3 size={20} strokeWidth={activeView === 'analytics' ? 2.4 : 1.8} />
        <span style={{ fontSize: '0.68rem', fontWeight: activeView === 'analytics' ? 700 : 500 }}>
          Stats
        </span>
      </button>

      {/* 5. Radar Tab */}
      <button
        type="button"
        onClick={() => setActiveView('radar')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: '6px 0',
          color: activeView === 'radar' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Clock size={20} strokeWidth={activeView === 'radar' ? 2.4 : 1.8} />
          {pendingFollowUpsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                backgroundColor: 'var(--stage-oa)',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-surface)'
              }}
            >
              {pendingFollowUpsCount > 9 ? '9+' : pendingFollowUpsCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: activeView === 'radar' ? 700 : 500 }}>
          Radar
        </span>
      </button>
    </nav>
  );
};
