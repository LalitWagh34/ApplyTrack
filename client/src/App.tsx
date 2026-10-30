/**
 * ApplyTrack - Root React Application
 * Linear / Meta + Cal AI Hybrid Desktop Workspace
 * Dual Theme (Light & Dark) • Midnight Slate • Zero AI-Slop Purple
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { Sidebar, ActiveNavView } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';

import { KanbanBoard } from './features/kanban/components/KanbanBoard.js';
import { ApplicationsListView } from './features/applications/components/ApplicationsListView.js';
import { AnalyticsView } from './features/analytics/components/AnalyticsView.js';
import { FollowUpRadarView } from './features/followups/components/FollowUpRadarView.js';
import { FollowUpBanner } from './features/followups/components/FollowUpBanner.js';

import { DraftModal } from './features/followups/components/DraftModal.js';
import { ApplicationModal } from './features/applications/components/ApplicationModal.js';
import { AddApplicationModal, AddApplicationModalInitialData } from './features/applications/components/AddApplicationModal.js';
import { LoginModal } from './features/auth/components/LoginModal.js';
import { ProfilePopover } from './features/profile/components/ProfilePopover.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { TermsOfServicePage } from './pages/TermsOfServicePage.js';

import { applicationsApi } from './features/applications/api/applicationsApi.js';
import { followupsApi } from './features/followups/api/followupsApi.js';
import { authApi } from './features/auth/api/authApi.js';

import { Application, ApplicationStatus } from './features/applications/types/application.types.js';
import { PendingFollowUp } from './features/followups/types/followup.types.js';
import { User } from './features/auth/types/auth.types.js';
import { Filter, ArrowUpDown } from 'lucide-react';

export function AppContent() {
  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const saved = localStorage.getItem('applytrack_applications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUp[]>([]);
  const [activeView, setActiveView] = useState<ActiveNavView>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [shareInitialData, setShareInitialData] = useState<AddApplicationModalInitialData | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('applytrack_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      const res = await applicationsApi.syncGmail();
      await fetchData();
      if (res.syncedCount > 0) {
        alert(res.message);
      } else {
        alert(res.message || 'Gmail is up to date.');
      }
    } catch {
      alert('Unable to sync with Gmail right now. Please check connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Draft Modal state
  const [draftModalData, setDraftModalData] = useState<{
    isOpen: boolean;
    appId: string;
    company: string;
    role: string;
  }>({
    isOpen: false,
    appId: '',
    company: '',
    role: ''
  });

  // Fetch applications & user profile from backend
  const fetchData = useCallback(async () => {
    const hasToken = Boolean(localStorage.getItem('applytrack_token'));
    if (!hasToken) {
      setUser(null);
      setApplications([]);
      setPendingFollowUps([]);
      return;
    }

    try {
      const currentUser = await authApi.getMe();
      if (currentUser) {
        setUser(currentUser);
        const [appsRes, followupsRes] = await Promise.allSettled([
          applicationsApi.list(),
          followupsApi.getPending()
        ]);
        if (appsRes.status === 'fulfilled' && appsRes.value?.applications) {
          setApplications(appsRes.value.applications);
        }
        if (followupsRes.status === 'fulfilled' && Array.isArray(followupsRes.value)) {
          setPendingFollowUps(followupsRes.value);
        }
      } else {
        // Only reset if token was removed due to 401 Unauthorized
        if (!localStorage.getItem('applytrack_token')) {
          setUser(null);
          setApplications([]);
          setPendingFollowUps([]);
        }
      }
    } catch {
      // On temporary network drop or Render cold-start, keep cached user session
      if (!localStorage.getItem('applytrack_token')) {
        setUser(null);
        setApplications([]);
        setPendingFollowUps([]);
      }
    }
  }, []);

  // Handle OAuth Token and Error from Redirect Callback URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authError = params.get('error');

    if (authError) {
      alert(`Authentication Error: ${decodeURIComponent(authError)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token) {
      localStorage.setItem('applytrack_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      void fetchData();
    }

    // Handle Mobile Share Target (PWA) incoming parameters from query string or hash
    const hashStr = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashStr);

    const rawUrl = params.get('url') || hashParams.get('url') || '';
    const rawText = params.get('text') || hashParams.get('text') || '';
    const rawTitle = params.get('title') || hashParams.get('title') || '';

    if (rawUrl || rawText || rawTitle) {
      let extractedUrl = rawUrl;
      if (!extractedUrl && rawText) {
        const urlMatch = rawText.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
          extractedUrl = urlMatch[0];
        }
      }

      let inferredCompany = '';
      let inferredRole = rawTitle;

      const atMatch = (rawTitle || rawText).match(/(?:at|for|to)\s+([A-Za-z0-9._\s-]+?)(?:\s+on|\s*[-–|]|\s*$)/i);
      if (atMatch && atMatch[1]) {
        inferredCompany = atMatch[1].trim();
      }

      setShareInitialData({
        jobUrl: extractedUrl,
        companyName: inferredCompany,
        roleTitle: inferredRole || 'Software Engineer'
      });
      setIsNewModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Handle Drag-and-Drop Column Shifts (Optimistic UI)
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    try {
      await applicationsApi.updateStatus(appId, newStatus);
    } catch {
      // Optimistic recovery handled gracefully
    }
  };

  const handleOpenDraft = (appId: string, company: string, role: string) => {
    setDraftModalData({
      isOpen: true,
      appId,
      company,
      role
    });
  };

  const handleArchiveApplication = async (appId: string) => {
    const target = applications.find((a) => a.id === appId);
    const company = target?.companyName || 'this application';
    if (!window.confirm(`Are you sure you want to delete/archive "${company}"?`)) {
      return;
    }

    // Optimistic UI removal
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    setPendingFollowUps((prev) => prev.filter((p) => p.applicationId !== appId));

    try {
      await applicationsApi.archive(appId);
    } catch {
      // Rollback on failure
      void fetchData();
    }
  };

  const handleBatchArchive = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    // Optimistic UI removal
    setApplications((prev) => prev.filter((a) => !ids.includes(a.id)));
    setPendingFollowUps((prev) => prev.filter((p) => !ids.includes(p.applicationId)));

    try {
      await applicationsApi.batchArchive(ids);
    } catch {
      void fetchData();
    }
  };

  const handleDismissFollowUp = async (appId: string) => {
    setPendingFollowUps((prev) => prev.filter((p) => p.applicationId !== appId));
    try {
      await followupsApi.dismiss(appId, 7);
    } catch {
      // Offline fallback
    }
  };

  // Filter applications by search query and sidebar priority filter
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (selectedPriority && app.priority !== selectedPriority) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        app.companyName.toLowerCase().includes(query) ||
        app.roleTitle.toLowerCase().includes(query) ||
        (app.location && app.location.toLowerCase().includes(query))
      );
    });
  }, [applications, searchQuery, selectedPriority]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* 1. Left Sidebar Navigation (Image 1 Style) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        pendingFollowUpsCount={pendingFollowUps.length}
        totalApplicationsCount={applications.length}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          void authApi.logout();
          setUser(null);
          setApplications([]);
          setPendingFollowUps([]);
          localStorage.removeItem('applytrack_applications');
        }}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header Navbar */}
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          pendingFollowUpsCount={pendingFollowUps.length}
          totalApplicationsCount={applications.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          user={user}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => {
            void authApi.logout();
            setUser(null);
            setApplications([]);
            setPendingFollowUps([]);
            localStorage.removeItem('applytrack_applications');
          }}
          onSyncGmail={handleSyncGmail}
          isSyncing={isSyncing}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* View Content */}
        <main className="has-mobile-bottom-nav" style={{ flex: 1 }}>
          {/* VIEW 1: KANBAN BOARD */}
          {activeView === 'board' && (
            <div>
              {/* Header Title & Subtitle Strip (Matching Image 1) */}
              <div
                style={{
                  padding: '16px 20px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Pipeline
                  </h1>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Track and manage applications • {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
                    {selectedPriority && ` (Filtered by ${selectedPriority})`}
                  </p>
                </div>

                {/* Quick Filters Pill Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedPriority && (
                    <button
                      onClick={() => setSelectedPriority(null)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Clear {selectedPriority} filter ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Overdue Follow-Up Alert Banner */}
              <FollowUpBanner
                pendingFollowUps={pendingFollowUps}
                onOpenRadarView={() => setActiveView('radar')}
                onOpenDraft={handleOpenDraft}
              />

              {/* Kanban Multi-Column Board */}
              <KanbanBoard
                applications={filteredApplications}
                onCardClick={(app) => setSelectedApp(app)}
                onStatusChange={handleStatusChange}
                onArchive={handleArchiveApplication}
              />
            </div>
          )}

          {/* VIEW 2: APPLICATIONS LIST VIEW */}
          {activeView === 'list' && (
            <div>
              <div style={{ padding: '16px 20px 0' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Applications Directory
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Overview of all submissions and engagements • {filteredApplications.length} records
                </p>
              </div>

              <ApplicationsListView
                applications={filteredApplications}
                onSelectApplication={(app) => setSelectedApp(app)}
                onArchive={handleArchiveApplication}
                onBatchArchive={handleBatchArchive}
              />
            </div>
          )}

          {/* VIEW 3: CAL AI STATS & INSIGHTS (DESKTOP ADAPTATION) */}
          {activeView === 'analytics' && (
            <AnalyticsView
              applications={applications}
              pendingFollowUps={pendingFollowUps}
              onOpenDraft={handleOpenDraft}
              onNavigateToBoard={() => setActiveView('board')}
            />
          )}

          {/* VIEW 4: FOLLOW-UP RADAR */}
          {activeView === 'radar' && (
            <FollowUpRadarView
              pendingFollowUps={pendingFollowUps}
              onOpenDraft={handleOpenDraft}
              onDismiss={handleDismissFollowUp}
              onNavigateToBoard={() => setActiveView('board')}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        pendingFollowUpsCount={pendingFollowUps.length}
        onOpenNewModal={() => setIsNewModalOpen(true)}
      />

      {/* Modals & Dialogs */}
      <DraftModal
        isOpen={draftModalData.isOpen}
        applicationId={draftModalData.appId}
        companyName={draftModalData.company}
        roleTitle={draftModalData.role}
        onClose={() => setDraftModalData((prev) => ({ ...prev, isOpen: false }))}
        onMarkSentSuccess={() => {
          void fetchData();
        }}
      />

      <ApplicationModal
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onUpdateSuccess={() => {
          void fetchData();
        }}
      />

      <AddApplicationModal
        isOpen={isNewModalOpen}
        initialData={shareInitialData}
        onClose={() => {
          setIsNewModalOpen(false);
          setShareInitialData(null);
        }}
        onSuccess={() => {
          setShareInitialData(null);
          void fetchData();
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ProfilePopover
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={() => {
          void authApi.logout();
          setUser(null);
          setApplications([]);
          setPendingFollowUps([]);
          setIsProfileOpen(false);
        }}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </div>
  );
}

export default function App() {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');

  const renderContent = () => {
    if (path === '/privacy' || path === '/privacy-policy') {
      return <PrivacyPolicyPage />;
    }
    if (path === '/terms' || path === '/terms-of-service') {
      return <TermsOfServicePage />;
    }
    return <AppContent />;
  };

  return (
    <ThemeProvider>
      {renderContent()}
    </ThemeProvider>
  );
}
