/**
 * CompanyLogo Component
 * Fetches high-resolution company favicon via Google's edge CDN with a graceful,
 * deterministic monogram fallback (Cal AI / Linear aesthetic).
 */
import React, { useState, useEffect } from 'react';

export interface CompanyLogoProps {
  companyName: string;
  domain?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const PALETTES = [
  { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' },
  { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', border: 'rgba(236, 72, 153, 0.25)' },
  { bg: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.25)' },
  { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.25)' }
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 1).toUpperCase();
}

function cleanDomainString(domainStr?: string | null): string {
  if (!domainStr) return '';
  return domainStr
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  domain,
  size = 24,
  className = '',
  style = {}
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanDomain = cleanDomainString(domain);
  const palette = getPalette(companyName || 'Company');
  const initials = getInitials(companyName || 'C');

  // Reset error state if domain changes
  useEffect(() => {
    setHasError(false);
  }, [cleanDomain]);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: `${Math.max(4, Math.round(size * 0.22))}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    ...style
  };

  const showImage = Boolean(cleanDomain) && !hasError;
  const logoUrl = cleanDomain
    ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
    : '';

  return (
    <div className={`company-logo ${className}`} style={containerStyle} title={companyName}>
      {showImage ? (
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          loading="lazy"
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: `${Math.max(2, Math.round(size * 0.1))}px`
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: palette.bg,
            color: palette.color,
            border: `1px solid ${palette.border}`,
            borderRadius: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.round(size * 0.44)}px`,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
