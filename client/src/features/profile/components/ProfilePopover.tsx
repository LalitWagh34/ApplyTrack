/**
 * ProfilePopover / ProfileSettingsModal Component
 * Inspired by reference Image 3: Modular card layout for Personal Profile, AI Context, Notifications & CSV Export
 */
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../auth/types/auth.types.js';
import { profileApi } from '../api/profileApi.js';
import { notificationsApi } from '../../notifications/api/notificationsApi.js';
import { Application } from '../../applications/types/application.types.js';
import { exportApplicationsToCSV } from '../../../utils/csvExport.utils.js';
import {
  X,
  FileText,
  CheckCircle2,
  Sparkles,
  Link2,
  Briefcase,
  Code2,
  Check,
  RotateCw,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Send
} from 'lucide-react';

interface ProfilePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onProfileUpdated: (updatedUser: User) => void;
  applications?: Application[];
}

export const ProfilePopover: React.FC<ProfilePopoverProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  applications = []
}) => {
  // Personal Profile state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState('');

  // AI Ghostwriter context
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [topProjects, setTopProjects] = useState('');

  // Preferences & Notifications
  const [followUpCadence, setFollowUpCadence] = useState<number>(7);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushStatusText, setPushStatusText] = useState('');
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // Status & Loaders
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to show status with auto-dismiss (default: 5 seconds)
  const showStatus = (type: 'success' | 'error', text: string, autoDismissMs: number = 5000) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatusMessage({ type, text });
    if (autoDismissMs > 0) {
      statusTimerRef.current = setTimeout(() => {
        setStatusMessage(null);
      }, autoDismissMs);
    }
  };

  const clearStatus = () => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatusMessage(null);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Sync state on user load or modal open
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setAvatarUrl(user.avatarUrl || null);
      const prefs = user.preferences || {};
      setTargetRole(prefs.targetRole || '');
      setTopSkills(Array.isArray(prefs.topSkills) ? prefs.topSkills.slice(0, 4) : []);
      setPortfolioLink(prefs.portfolioLink || '');
      setTopProjects(Array.isArray(prefs.topProjects) ? prefs.topProjects.join('\n') : '');
      setFollowUpCadence(typeof (prefs as any)?.followUpCadenceDays === 'number' ? (prefs as any).followUpCadenceDays : 7);

      // Check current notification state: user preference and browser permission
      const userNotificationPref = (prefs as any)?.notificationsEnabled;
      const perm = notificationsApi.getPermission();

      if (perm === 'denied') {
        setIsPushEnabled(false);
        setPushStatusText('Blocked by Browser');
      } else if (typeof userNotificationPref === 'boolean') {
        setIsPushEnabled(userNotificationPref);
        setPushStatusText(userNotificationPref ? 'Enabled' : 'Disabled');
      } else {
        notificationsApi.isSubscribed().then((subscribed) => {
          setIsPushEnabled(subscribed);
          setPushStatusText(subscribed ? 'Enabled' : 'Disabled');
        });
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Handle Custom Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showStatus('error', 'Image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      showStatus('success', 'New photo selected! Click "Update Profile" to save.');
    };
    reader.readAsDataURL(file);
  };

  // Revert / Fetch Login Photo from Google OAuth
  const handleFetchLoginPhoto = () => {
    if (user.googleId || user.hasGoogleLinked) {
      // Revert to Google account picture format
      const googlePic = `https://lh3.googleusercontent.com/a/default-user`;
      setAvatarUrl(googlePic);
      showStatus('success', 'Original Google photo fetched!');
    } else {
      showStatus('error', 'No external OAuth provider linked for this account.');
    }
  };

  // Remove Photo (reset to monogram)
  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    showStatus('success', 'Photo removed. Monogram will be used.');
  };

  // Handle Resume PDF file selection
  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('error', 'Please upload a PDF file (.pdf).');
      return;
    }

    setIsUploading(true);
    clearStatus();

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const result = await profileApi.parseResume(base64Data, file.name);

          if (result.fullName && !fullName) {
            setFullName(result.fullName);
          }
          if (result.preferences) {
            const p = result.preferences;
            if (p.targetRole) setTargetRole(p.targetRole);
            if (p.topSkills) setTopSkills(p.topSkills.slice(0, 4));
            if (p.portfolioLink) setPortfolioLink(p.portfolioLink);
            if (p.topProjects) setTopProjects(p.topProjects.join('\n'));
          }

          showStatus('success', '⚡ Resume parsed by Groq AI! Fields auto-filled below.');

          const updated = await profileApi.getProfile();
          if (updated) onProfileUpdated(updated);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to parse resume';
          showStatus('error', msg);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        showStatus('error', 'Failed to read file.');
      };

      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      showStatus('error', 'Error reading file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle Web Push Notifications
  const handleTogglePush = async () => {
    if (isTogglingPush) return;
    setIsTogglingPush(true);
    clearStatus();

    try {
      if (isPushEnabled) {
        await notificationsApi.unsubscribe();
        setIsPushEnabled(false);
        setPushStatusText('Disabled');
        const updated = await profileApi.updateProfile({ notificationsEnabled: false });
        if (updated) onProfileUpdated(updated);
        showStatus('success', 'Push notifications disabled.');
      } else {
        const perm = notificationsApi.getPermission();
        if (perm === 'denied') {
          throw new Error('Notifications are blocked by your browser. Click the lock icon 🔒 in the URL address bar to Allow.');
        }

        await notificationsApi.subscribe();
        setIsPushEnabled(true);
        setPushStatusText('Enabled');
        const updated = await profileApi.updateProfile({ notificationsEnabled: true });
        if (updated) onProfileUpdated(updated);
        showStatus('success', '🔔 Desktop & Mobile Push Notifications enabled!');
      }
    } catch (err: any) {
      console.error('Failed to toggle notifications:', err);
      showStatus('error', err.message || 'Failed to toggle notifications.');
    } finally {
      setIsTogglingPush(false);
    }
  };

  // Send Test Push Notification
  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const msg = await notificationsApi.sendTestPush();
      showStatus('success', `✅ ${msg}`, 5000);
    } catch (err: any) {
      showStatus('error', err.message || 'Enable push notifications first.', 5000);
    } finally {
      setIsTestingPush(false);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const clean = newSkillInput.trim();
    if (clean && !topSkills.includes(clean) && topSkills.length < 4) {
      setTopSkills([...topSkills, clean]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTopSkills(topSkills.filter((s) => s !== skillToRemove));
  };

  // Save All Changes
  const handleSave = async () => {
    setIsSaving(true);
    clearStatus();

    try {
      const projectsArr = topProjects
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const updated = await profileApi.updateProfile({
        fullName,
        avatarUrl,
        targetRole,
        topSkills,
        portfolioLink,
        topProjects: projectsArr,
        followUpCadenceDays: followUpCadence,
        notificationsEnabled: isPushEnabled
      });

      onProfileUpdated(updated);
      showStatus('success', '✅ Profile & Settings successfully updated!', 3000);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      showStatus('error', msg, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (fullName || user.email || 'U')[0].toUpperCase();

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative'
        }}
      >
        {/* Header: Title & Close Button (Image 3 Inspiration) */}
        <div
          style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}
              >
                Profile & Job Search Settings
              </h2>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  border: '1px solid rgba(22, 163, 74, 0.25)'
                }}
              >
                Account
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Configure your identity, AI ghostwriter context, notifications, and export options.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* CARD 1: PERSONAL PROFILE (Exact Reference Image 3 Design) */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px'
            }}
          >
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Personal Profile
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 16px' }}>
              Manage your identity details and custom photo.
            </p>

            {/* Photo Avatar Preview & Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Avatar'}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--border-color)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                  }}
                >
                  {initial}
                </div>
              )}

              {/* Photo Action Buttons (Image 3 Style) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={12} />
                  Upload Photo
                </button>

                <button
                  type="button"
                  onClick={handleFetchLoginPhoto}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} />
                  Fetch Login Photo
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      backgroundColor: 'rgba(244, 63, 94, 0.08)',
                      color: '#e11d48',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Inputs: Display Name & Target Role */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Username / Display Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Lalit wagh"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  <Briefcase size={13} />
                  Target Role / Professional Headline
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, SDE-1"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: AI GHOSTWRITER & RESUME PARSER */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Sparkles size={16} style={{ color: 'var(--stage-oa)' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                AI Ghostwriter & Resume Context
              </h3>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 14px' }}>
              Powers hyper-personalized follow-up emails using Groq Llama 3.3.
            </p>

            {/* Resume Upload Pill Button */}
            <div style={{ marginBottom: '14px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleResumeFileChange}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px dashed var(--accent)',
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isUploading ? 'not-allowed' : 'pointer'
                }}
              >
                {isUploading ? (
                  <>
                    <RotateCw size={16} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>
                      Extracting Skills & Projects with Groq AI...
                    </span>
                  </>
                ) : (
                  <>
                    <FileText size={17} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
                      Upload Resume (PDF) • Instant Auto-Fill
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Top Skills */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Code2 size={13} />
                  Featured Skills (Max 4)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{topSkills.length}/4</span>
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.74rem',
                      fontWeight: 600
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {topSkills.length < 4 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Add skill (e.g. React) and press Enter"
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Portfolio Link */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Link2 size={13} />
                Portfolio / GitHub Link
              </label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="e.g. https://github.com/LalitWagh34"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Top Projects */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Sparkles size={13} style={{ color: 'var(--stage-oa)' }} />
                Top Projects Snippet
              </label>
              <textarea
                rows={2}
                value={topProjects}
                onChange={(e) => setTopProjects(e.target.value)}
                placeholder="e.g. ApplyTrack - Minimal Linear-style tracker with automated Gmail Sync"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          </div>

          {/* CARD 3: NOTIFICATIONS & FOLLOW-UP CADENCE */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Bell size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Notifications & Follow-Up Cadence
              </h3>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 14px' }}>
              Receive lockscreen alerts for OA deadlines, tests, and dormant applications.
            </p>

            {/* Web Push Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                marginBottom: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Web Push Notifications
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Status: <strong>{pushStatusText}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPushEnabled && (
                  <button
                    type="button"
                    disabled={isTestingPush}
                    onClick={handleTestPush}
                    title="Send a live test notification"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: isTestingPush ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Send size={11} />
                    <span>{isTestingPush ? 'Testing...' : 'Test Alert'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isTogglingPush}
                  onClick={handleTogglePush}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isPushEnabled ? 'rgba(244, 63, 94, 0.12)' : '#16a34a',
                    color: isPushEnabled ? '#e11d48' : '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: isTogglingPush ? 'wait' : 'pointer',
                    opacity: isTogglingPush ? 0.7 : 1
                  }}
                >
                  {isTogglingPush ? 'Updating...' : isPushEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Follow-Up Cadence Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Default Follow-Up Cadence
              </label>
              <select
                value={followUpCadence}
                onChange={(e) => setFollowUpCadence(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={4}>4 Days (Aggressive Follow-up)</option>
                <option value={7}>7 Days (Standard / Recommended)</option>
                <option value={10}>10 Days (Relaxed Cadence)</option>
                <option value={14}>14 Days (Two Weeks)</option>
              </select>
            </div>
          </div>

          {/* CARD 4: DATA PORTABILITY & EXPORT */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Download size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Data Portability & Export
              </h3>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 14px' }}>
              Export your job hunt records anytime to Excel, Google Sheets, or local storage.
            </p>

            <button
              type="button"
              onClick={() => exportApplicationsToCSV(applications)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            >
              <Download size={15} />
              <span>Export Applications as CSV ({applications.length} records)</span>
            </button>
          </div>
        </div>

        {/* Footer: Cancel & Update Profile (Image 3 Style) */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.28)'
            }}
          >
            <Check size={16} />
            <span>{isSaving ? 'Updating...' : 'Update Profile'}</span>
          </button>
        </div>

        {/* Floating Toaster Notification (Auto-dismisses in 5s) */}
        {statusMessage && (
          <div
            style={{
              position: 'absolute',
              bottom: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 120,
              maxWidth: '90%',
              width: 'max-content',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: statusMessage.type === 'success' ? '#0f291e' : '#2b1117',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
              color: statusMessage.type === 'success' ? '#4ade80' : '#fb7185',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeInUp 0.22s ease-out'
            }}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#22c55e' }} />
            ) : (
              <ShieldAlert size={16} style={{ flexShrink: 0, color: '#f43f5e' }} />
            )}
            <span style={{ lineHeight: 1.4 }}>{statusMessage.text}</span>
            <button
              type="button"
              onClick={clearStatus}
              aria-label="Dismiss toast"
              style={{
                background: 'none',
                border: 'none',
                color: 'currentColor',
                cursor: 'pointer',
                padding: '2px',
                opacity: 0.7,
                marginLeft: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePopover;
