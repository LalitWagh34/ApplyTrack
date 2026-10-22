/**
 * Public Privacy Policy Page
 * Fully compliant with Google OAuth & CASA Verification standards
 * (includes Google API Services User Data Policy Limited Use disclosure)
 */
import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Server, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              transition: 'color 0.15s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ApplyTrack Legal</span>
          </div>
        </div>

        {/* Header Hero */}
        <div
          style={{
            padding: '36px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--stage-offer)'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Privacy Policy
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Effective Date: October 2026 • ApplyTrack Application Tracker
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            At <strong>ApplyTrack</strong>, we believe job tracking should be effortless, transparent, and completely private.
            This Privacy Policy explains how ApplyTrack (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, protects, and handles
            your data when you use our web application, PWA, and related services.
          </p>
        </div>

        {/* CRITICAL: Google API Limited Use Disclosure Callout */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Lock size={20} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: '#93c5fd' }}>
                Google API Services User Data Policy Compliance
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, margin: 0, color: 'var(--text-secondary)' }}>
                ApplyTrack&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                  Google API Services User Data Policy
                </a>
                , including the <strong>Limited Use</strong> requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
          {/* Section 1 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <EyeOff size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                1. Zero Email Body Storage Guarantee
              </h2>
            </div>
            <p style={{ margin: '0 0 12px 0' }}>
              We respect the confidentiality of your correspondence. ApplyTrack uses restricted Google OAuth scopes
              (<code>gmail.metadata</code>) solely to detect job application activity.
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>We NEVER read or store email body content:</strong> We do not log, parse, or keep the text of your personal emails.</li>
              <li><strong>Metadata Only:</strong> We inspect only message headers: sender address, recipient address, subject line, message/thread ID, and timestamp.</li>
              <li><strong>Noise Blocker:</strong> Promotional emails, automated alerts (e.g. GitHub, LinkedIn notifications), and personal correspondence are ignored immediately.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Server size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                2. Information We Collect
              </h2>
            </div>
            <p style={{ margin: '0 0 12px 0' }}>When you register and use ApplyTrack, we process the following data:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Account Profile:</strong> Name, email address, and avatar URL provided via Google or GitHub OAuth.</li>
              <li><strong>Job Applications:</strong> Company names, job titles, application URLs, statuses (Applied, Interview, Offer, Rejected), and user-written notes.</li>
              <li><strong>Resume Context:</strong> Uploaded PDF resumes are parsed <strong>strictly in volatile server RAM memory</strong> to extract your target role, top skills, and portfolio projects. Resumes are <strong>never written to permanent disk storage or public buckets</strong>.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--stage-offer)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                3. How We Use Your Information
              </h2>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>To provide the job tracking pipeline (Kanban board, follow-up radar, and metrics).</li>
              <li>To prompt you when an application email is sent (&quot;Track email to Company?&quot;).</li>
              <li>To generate personalized, contextual follow-up drafts citing your actual skills via Groq AI.</li>
              <li><strong>No Advertising:</strong> We do NOT sell, rent, or trade your personal information to third parties, advertisers, or data brokers.</li>
              <li><strong>No Model Training:</strong> Your private correspondence is never used to train generalized artificial intelligence models.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Lock size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                4. Data Security & Encryption
              </h2>
            </div>
            <p style={{ margin: '0 0 12px 0' }}>We implement industry-standard cryptographic protection:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>AES-256-GCM Encryption:</strong> OAuth tokens and refresh tokens are encrypted at rest using an AES-256-GCM encryption vault prior to database storage.</li>
              <li><strong>HTTPS / TLS:</strong> All communications between your browser and our servers are encrypted in transit via TLS 1.3.</li>
              <li><strong>Stateless Sessions:</strong> Authentication sessions use cryptographically signed JWTs stored in your browser&apos;s local storage.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                5. User Control & Data Deletion
              </h2>
            </div>
            <p style={{ margin: '0 0 12px 0' }}>You retain full control over your data at all times:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Revoke Access:</strong> You can disconnect ApplyTrack from your Google Account at any time via{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  Google Security Permissions
                </a>.
              </li>
              <li><strong>Account Deletion:</strong> You may request complete deletion of your account, job records, and token vault by contacting us at <code>lalitwagh2804@gmail.com</code>.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              6. Contact Information
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions, feedback, or concerns regarding this Privacy Policy or your data, please contact us at:
              <br />
              <strong>Email:</strong> <a href="mailto:lalitwagh2804@gmail.com" style={{ color: 'var(--accent)' }}>lalitwagh2804@gmail.com</a>
              <br />
              <strong>Application:</strong> ApplyTrack (https://apply-track-1h5z.vercel.app)
            </p>
          </section>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', padding: '24px 0', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} ApplyTrack. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
            <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</a>
            <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="/privacy" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
