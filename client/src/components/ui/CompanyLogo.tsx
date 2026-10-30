/**
 * CompanyLogo Component
 * Ultra-resilient company logo loader with:
 * 1. Automatic domain derivation from company name if domain is missing (e.g. Amazon -> amazon.com)
 * 2. High-res Clearbit logo -> Google Favicon cascade
 * 3. Low-res / blurry generic icon detection (filters out 16px blurry placeholders)
 * 4. Deterministic, aesthetic Linear-style Monogram fallback
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

const KNOWN_DOMAINS: Record<string, string> = {
  amazon: 'amazon.com',
  google: 'google.com',
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  netflix: 'netflix.com',
  swiggy: 'swiggy.in',
  zomato: 'zomato.com',
  uber: 'uber.com',
  razorpay: 'razorpay.com',
  cred: 'cred.club',
  flipkart: 'flipkart.com',
  stripe: 'stripe.com',
  linkedin: 'linkedin.com',
  github: 'github.com',
  atlassian: 'atlassian.com',
  adobe: 'adobe.com',
  salesforce: 'salesforce.com',
  oracle: 'oracle.com',
  nvidia: 'nvidia.com',
  spotify: 'spotify.com',
  tower: 'tower-research.com',
  'tower research': 'tower-research.com',
  'tower research capital': 'tower-research.com'
};

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

function resolveDomain(domainStr?: string | null, companyName?: string): string {
  if (domainStr) {
    const cleaned = domainStr
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();
    if (cleaned && cleaned.includes('.')) return cleaned;
  }

  if (companyName) {
    const normalized = companyName.toLowerCase().trim();
    if (KNOWN_DOMAINS[normalized]) {
      return KNOWN_DOMAINS[normalized];
    }
    const cleanSlug = normalized.replace(/[^a-z0-9]/g, '');
    if (cleanSlug && cleanSlug.length >= 2) {
      return `${cleanSlug}.com`;
    }
  }
  return '';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  domain,
  size = 24,
  className = '',
  style = {}
}) => {
  // Step 0: Clearbit high-res, Step 1: Google S2 Favicon, Step 2: Monogram fallback
  const [sourceStep, setSourceStep] = useState<number>(0);
  const cleanDomain = resolveDomain(domain, companyName);
  const palette = getPalette(companyName || 'Company');
  const initials = getInitials(companyName || 'C');

  // Reset step whenever domain or companyName changes
  useEffect(() => {
    setSourceStep(0);
  }, [cleanDomain, companyName]);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: `${Math.max(4, Math.round(size * 0.24))}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    flexShrink: 0,
    ...style
  };

  const getImageUrl = () => {
    if (!cleanDomain) return '';
    if (sourceStep === 0) {
      // 1. Clearbit High-Res Brand Logo
      return `https://logo.clearbit.com/${cleanDomain}`;
    }
    if (sourceStep === 1) {
      // 2. Google Favicon CDN
      return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
    }
    return '';
  };

  const imageUrl = getImageUrl();
  const showImage = Boolean(imageUrl) && sourceStep < 2;

  const handleImageError = () => {
    setSourceStep((prev) => prev + 1);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // If image returned is a tiny 16px blurry icon or empty generic placeholder, fallback immediately
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      setSourceStep((prev) => prev + 1);
    }
  };

  return (
    <div className={`company-logo ${className}`} style={containerStyle} title={companyName}>
      {showImage ? (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={`${companyName} logo`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'auto',
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
