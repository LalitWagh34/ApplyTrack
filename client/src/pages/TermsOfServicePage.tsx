/**
 * Public Terms of Service Page
 * Complements Google OAuth Verification
 */
import React from 'react';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
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
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Terms of Service
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Effective Date: October 2026 • ApplyTrack Application Tracker
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            By accessing or using ApplyTrack, you agree to be bound by these Terms of Service.
            If you disagree with any part of the terms, you may discontinue use of the service.
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              1. Service Description
            </h2>
            <p style={{ margin: 0 }}>
              ApplyTrack is a job application management system designed to help users track job submissions,
              organize candidate pipelines, compute follow-up reminders, and synchronize application activity via supported email APIs.
            </p>
          </section>

          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              2. User Accounts & Security
            </h2>
            <p style={{ margin: 0 }}>
              You are responsible for maintaining the confidentiality of your account authentication tokens and credentials.
              ApplyTrack will not be liable for any loss or damage arising from unauthorized access resulting from your failure to safeguard your credentials.
            </p>
          </section>

          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              3. Acceptable Use
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>You agree not to misuse ApplyTrack to scrape, disrupt, or compromise the stability of our services or integrated APIs.</li>
              <li>You agree not to use AI follow-up features to generate unsolicited commercial spam or harassing messages.</li>
            </ul>
          </section>

          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              4. Disclaimer & Limitation of Liability
            </h2>
            <p style={{ margin: 0 }}>
              ApplyTrack is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.
              We are not responsible for recruiter responses, hiring decisions, or email delivery outcomes.
            </p>
          </section>

          <section
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              5. Contact Us
            </h2>
            <p style={{ margin: 0 }}>
              For legal inquiries regarding these terms, contact <a href="mailto:support@applytrack.dev" style={{ color: 'var(--accent)' }}>support@applytrack.dev</a>.
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
            <a href="/terms" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
            <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
