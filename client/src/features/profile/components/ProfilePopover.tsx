/**
 * ProfilePopover Component
 * Linear.app style Popover (Desktop) / Bottom-Sheet (Mobile)
 * Instant Resume PDF parser via Groq AI & user context for Follow-Up Ghostwriter
 */
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../auth/types/auth.types.js';
import { profileApi, ProfilePreferences } from '../api/profileApi.js';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  LogOut, 
  Link2, 
  Briefcase, 
  Code2, 
  Plus, 
  Check, 
  Zap, 
  RotateCw 
} from 'lucide-react';

interface ProfilePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfilePopover: React.FC<ProfilePopoverProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onProfileUpdated
}) => {
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [topProjects, setTopProjects] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever user changes or modal opens
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      const prefs = user.preferences || {};
      setTargetRole(prefs.targetRole || '');
      setTopSkills(Array.isArray(prefs.topSkills) ? prefs.topSkills.slice(0, 4) : []);
      setPortfolioLink(prefs.portfolioLink || '');
      setTopProjects(Array.isArray(prefs.topProjects) ? prefs.topProjects.join('\n') : '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Handle PDF file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMessage({ type: 'error', text: 'Please upload a PDF file (.pdf).' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

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

          setStatusMessage({
            type: 'success',
            text: '⚡ Resume parsed by Groq AI! Fields auto-filled below.'
          });

          // Fetch refreshed profile
          const updated = await profileApi.getProfile();
          if (updated) onProfileUpdated(updated);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to parse resume';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        setStatusMessage({ type: 'error', text: 'Failed to read file.' });
      };

      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      setStatusMessage({ type: 'error', text: 'Error selecting file.' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add a skill chip
  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const clean = newSkillInput.trim();
    if (clean && !topSkills.includes(clean) && topSkills.length < 4) {
      setTopSkills([...topSkills, clean]);
      setNewSkillInput('');
    }
  };

  // Remove a skill chip
  const handleRemoveSkill = (skillToRemove: string) => {
    setTopSkills(topSkills.filter((s) => s !== skillToRemove));
  };

  // Save updated context
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const projectsArr = topProjects
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const updated = await profileApi.updateProfile({
        fullName,
        targetRole,
        topSkills,
        portfolioLink,
        topProjects: projectsArr
      });

      onProfileUpdated(updated);
      setStatusMessage({ type: 'success', text: 'AI Context saved! Follow-up drafts updated.' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* 1. Header: Avatar, Name, Email, Google Status */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User'}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                {(user.fullName || user.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user.fullName || 'Candidate Profile'}
                </h3>
                {user.hasGoogleLinked && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--stage-offer)',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--stage-offer)' }} />
                    Gmail Synced
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {statusMessage && (
            <div
              style={{
                marginBottom: '14px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: statusMessage.type === 'success' ? 'var(--stage-offer)' : 'var(--stage-rejected)'
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 2. Primary Hero Action: Upload Resume Button */}
          <div style={{ marginBottom: '18px' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px dashed var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isUploading ? (
                <>
                  <RotateCw size={17} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent)' }}>
                    Parsing Resume with Groq AI...
                  </span>
                </>
              ) : (
                <>
                  <FileText size={18} style={{ color: 'var(--accent)' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent)' }}>
                      Upload Resume (PDF)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Auto-extracts skills & projects for AI Ghostwriter • 15s setup
                    </div>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* 3. Auto-filled / Editable Context Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Your Name (for email sign-offs)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Lalit Wagh"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Target Role */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Briefcase size={12} />
                Target Role / Headline
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, SDE-1"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Top Skills (Max 3-4 Chips) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Code2 size={12} />
                  Top Skills (Max 4)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {topSkills.length}/4
                </span>
              </label>

              {/* Chips Bar */}
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
                      backgroundColor: 'var(--bg-subtle)',
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
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex'
                      }}
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
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
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
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Link2 size={12} />
                Portfolio / GitHub Link
              </label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="e.g. https://github.com/yourhandle"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Top Projects Summary */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Sparkles size={12} style={{ color: 'var(--stage-oa)' }} />
                Top Projects (Referenced by AI Ghostwriter)
              </label>
              <textarea
                rows={2}
                value={topProjects}
                onChange={(e) => setTopProjects(e.target.value)}
                placeholder="e.g. ApplyTrack - Minimalist job tracker with Gmail sync & BullMQ"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. Footer: Logout & Save */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--stage-rejected)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
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
                padding: '7px 16px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Check size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Context'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopover;
