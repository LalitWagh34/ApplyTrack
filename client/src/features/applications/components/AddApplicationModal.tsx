/**
 * Add Application Modal
 * Ultra-Fast 5-Second Linear-style dialog to track job applications
 * Features auto-domain extraction from Job URL and Company Name for Pillar 3 matching
 */
import React, { useState, useEffect } from 'react';
import { applicationsApi } from '../api/applicationsApi.js';
import { PriorityLevel } from '../types/application.types.js';
import { X, Plus, Sparkles, Globe, Link2, Building2, Briefcase, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export interface AddApplicationModalInitialData {
  companyName?: string;
  roleTitle?: string;
  jobUrl?: string;
  source?: string;
  companyDomain?: string;
}

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AddApplicationModalInitialData | null;
}

const SOURCES = [
  'LinkedIn',
  'Internshala',
  'Careers Page',
  'Cold Mail',
  'Indeed / Naukri',
  'Other'
] as const;

type ApplicationSource = typeof SOURCES[number];

/**
 * Extracts base domain from URL (e.g. careers.swiggy.com -> swiggy.com)
 */
function extractBaseDomain(urlStr: string): { domain: string; detectedSource?: ApplicationSource } | null {
  try {
    let clean = urlStr.trim();
    if (!clean) return null;
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);

    // Identify common portals
    if (host.includes('linkedin.com')) {
      return { domain: '', detectedSource: 'LinkedIn' };
    }
    if (host.includes('internshala.com')) {
      return { domain: '', detectedSource: 'Internshala' };
    }
    if (host.includes('indeed.com') || host.includes('naukri.com')) {
      return { domain: '', detectedSource: 'Indeed / Naukri' };
    }

    // Extract base domain for company career pages
    const parts = host.split('.');
    if (parts.length >= 2) {
      const baseDomain = parts.slice(-2).join('.');
      return { domain: baseDomain, detectedSource: 'Careers Page' };
    }
    return { domain: host, detectedSource: 'Careers Page' };
  } catch {
    return null;
  }
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData
}) => {
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [source, setSource] = useState<ApplicationSource>('LinkedIn');
  const [jobUrl, setJobUrl] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [isDomainManuallyEdited, setIsDomainManuallyEdited] = useState(false);

  // Optional fields (collapsible)
  const [showMore, setShowMore] = useState(false);
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [stageDueDate, setStageDueDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-populate when opened with initialData (e.g. from Mobile Share Target or LinkedIn)
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.companyName) setCompanyName(initialData.companyName);
      if (initialData.roleTitle) setRoleTitle(initialData.roleTitle);
      if (initialData.source) setSource(initialData.source as ApplicationSource);
      if (initialData.companyDomain) setCompanyDomain(initialData.companyDomain);
      if (initialData.jobUrl) {
        setJobUrl(initialData.jobUrl);
        const extracted = extractBaseDomain(initialData.jobUrl);
        if (extracted?.detectedSource && !initialData.source) {
          setSource(extracted.detectedSource);
        }
        if (extracted?.domain && !initialData.companyDomain) {
          setCompanyDomain(extracted.domain);
        }
      }
    }
  }, [isOpen, initialData]);

  // Auto-extract domain or source when Job URL changes
  const handleJobUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setJobUrl(val);

    const extracted = extractBaseDomain(val);
    if (extracted) {
      if (extracted.detectedSource) {
        setSource(extracted.detectedSource);
      }
      if (extracted.domain && !isDomainManuallyEdited) {
        setCompanyDomain(extracted.domain);
      }
    }
  };

  // Auto-generate domain placeholder when Company Name is typed
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyName(name);

    if (!isDomainManuallyEdited && !jobUrl.trim()) {
      const cleanSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSlug) {
        setCompanyDomain(`${cleanSlug}.com`);
      } else {
        setCompanyDomain('');
      }
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDomainManuallyEdited(true);
    setCompanyDomain(e.target.value.trim().toLowerCase());
  };

  // Reset fields on close
  useEffect(() => {
    if (!isOpen) {
      setCompanyName('');
      setRoleTitle('');
      setSource('LinkedIn');
      setJobUrl('');
      setCompanyDomain('');
      setIsDomainManuallyEdited(false);
      setLocation('');
      setSalaryRange('');
      setPriority('MEDIUM');
      setStageDueDate('');
      setShowMore(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim()) {
      setError('Company name and Role title are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await applicationsApi.create({
        companyName: companyName.trim(),
        roleTitle: roleTitle.trim(),
        companyDomain: companyDomain.trim() || undefined,
        jobUrl: jobUrl.trim() || undefined,
        source,
        location: location.trim() || undefined,
        salaryRange: salaryRange.trim() || undefined,
        priority,
        stageDueDate: stageDueDate ? new Date(stageDueDate).toISOString() : undefined
      });

      onSuccess();
      onClose();
    } catch {
      setError('Failed to create application. Check network or server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
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
          maxWidth: '500px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--stage-applied)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Track New Application
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Quick 5-second entry • Auto domain & stage tracking
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
              padding: '4px',
              borderRadius: '4px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', maxHeight: 'calc(88vh - 70px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {error && (
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid var(--stage-rejected)',
                color: 'var(--stage-rejected)',
                fontSize: '0.8rem'
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Company Name & Domain */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  <Building2 size={13} />
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  placeholder="e.g. Swiggy, Google"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '5px'
                  }}
                  title="Used by ApplyTracker to auto-match incoming test/interview emails"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={13} />
                    Domain
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 500 }}>
                    Auto-sync
                  </span>
                </label>
                <input
                  type="text"
                  value={companyDomain}
                  onChange={handleDomainChange}
                  placeholder="e.g. swiggy.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* 2. Role Title */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Briefcase size={13} />
                Role Title *
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. SDE Intern, Frontend Engineer, React Dev"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* 3. Source Selector (Linear-Style Pill Strip) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Application Source
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SOURCES.map((src) => {
                  const isSelected = source === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSource(src)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-subtle)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {src}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Job Link (Optional with auto-extract) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                <Link2 size={13} />
                Job URL (Optional)
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={handleJobUrlChange}
                placeholder="https://careers.swiggy.com/job/123 or LinkedIn link"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Collapsible: More Details (Location, Salary, Priority) */}
            <div>
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                <span>{showMore ? 'Hide extra details' : '+ Add Location, Salary & Priority'}</span>
                {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showMore && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Remote, Bangalore"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Salary Range
                      </label>
                      <input
                        type="text"
                        value={salaryRange}
                        onChange={(e) => setSalaryRange(e.target.value)}
                        placeholder="e.g. ₹15-20 LPA"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Priority
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['LOW', 'MEDIUM', 'HIGH'] as PriorityLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setPriority(lvl)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: priority === lvl ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                            backgroundColor: priority === lvl ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-subtle)',
                            color: priority === lvl ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '0.74rem',
                            fontWeight: priority === lvl ? 600 : 400,
                            cursor: 'pointer'
                          }}
                        >
                          {lvl === 'HIGH' ? 'P1 High' : lvl === 'MEDIUM' ? 'P2 Medium' : 'P3 Low'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Calendar size={12} />
                      Stage Due Date / Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={stageDueDate}
                      onChange={(e) => setStageDueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                      Auto-detected from email sync or can be set manually for OA/Interview stages.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>{isSubmitting ? 'Saving...' : 'Track Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplicationModal;
