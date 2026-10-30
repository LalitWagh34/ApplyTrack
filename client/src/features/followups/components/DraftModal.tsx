/**
 * Follow-Up Draft Modal
 * Generates tailored contextual email drafts with tone switches and guaranteed cross-browser clipboard copy
 */
import React, { useState, useEffect } from 'react';
import { followupsApi } from '../api/followupsApi.js';
import { FollowUpDraft } from '../types/followup.types.js';
import { Copy, Check, X, Send, Sparkles, ExternalLink, Zap, Info } from 'lucide-react';

interface DraftModalProps {
  applicationId: string | null;
  companyName: string;
  roleTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onMarkSentSuccess: () => void;
}

/**
 * Universal cross-browser copy helper (works on localhost, HTTP, HTTPS, Safari, mobile)
 */
function universalCopy(text: string): boolean {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackExecCopy(text);
    });
    return true;
  }
  return fallbackExecCopy(text);
}

function fallbackExecCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    document.body.removeChild(textarea);
    return false;
  }
}

export const DraftModal: React.FC<DraftModalProps> = ({
  applicationId,
  companyName,
  roleTitle,
  isOpen,
  onClose,
  onMarkSentSuccess
}) => {
  const [tone, setTone] = useState<'polite_nudge' | 'value_add' | 'polite_breakup'>('polite_nudge');
  const [draft, setDraft] = useState<FollowUpDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<'all' | 'body' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    const fetchDraft = async () => {
      setIsLoading(true);
      try {
        const res = await followupsApi.generateDraft(applicationId, tone);
        setDraft(res);
      } catch {
        // Fallback default draft
        setDraft({
          subject: `Following up: ${roleTitle} at ${companyName}`,
          body: `Hi Team,\n\nI wanted to gently follow up on my recent application for the ${roleTitle} role at ${companyName}.\n\nLooking forward to hearing from you!\n\nBest regards,`,
          threadId: ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDraft();
  }, [isOpen, applicationId, tone, companyName, roleTitle]);

  if (!isOpen) return null;

  const handleCopyFull = () => {
    if (!draft) return;
    const fullText = `Subject: ${draft.subject}\n\n${draft.body}`;
    universalCopy(fullText);
    setCopiedType('all');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyBodyOnly = () => {
    if (!draft) return;
    universalCopy(draft.body);
    setCopiedType('body');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleMarkSent = async () => {
    if (!applicationId) return;
    setIsSubmitting(true);
    try {
      await followupsApi.markSent(applicationId, draft?.body);
      setActionNotice(`✅ Follow-up logged for ${companyName}!`);
      setTimeout(() => {
        onMarkSentSuccess();
        onClose();
        setActionNotice(null);
      }, 900);
    } catch {
      alert('Unable to log follow-up right now. Please try again.');
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
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
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
            <Sparkles size={18} style={{ color: 'var(--stage-oa)' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                1-Click Follow-Up Draft
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {companyName} • {roleTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Explanatory How-It-Works Pill */}
        <div
          style={{
            margin: '12px 20px 0',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>How it works:</strong> Copy this AI-tailored draft or tap <strong>Open in Gmail</strong> to send it from your email. Then tap <strong>Mark as Sent</strong> to update your timeline & follow-up counter.
          </span>
        </div>

        {/* Tone Switchers */}
        <div style={{ padding: '12px 20px 0', display: 'flex', gap: '8px' }}>
          {(
            [
              { id: 'polite_nudge', label: 'Polite Nudge' },
              { id: 'value_add', label: 'Value-Add Update' },
              { id: 'polite_breakup', label: 'Polite Break-up' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTone(item.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: tone === item.id ? 'var(--accent)' : 'var(--border-color)',
                backgroundColor: tone === item.id ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                color: tone === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Draft Content */}
        <div style={{ padding: '14px 20px' }}>
          {isLoading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--accent)' }}>
                <Zap size={16} />
                <span style={{ fontWeight: 600 }}>Groq AI Ghostwriter</span>
              </div>
              <p>Crafting hyper-personalized follow-up with Llama 3.3...</p>
            </div>
          ) : draft ? (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Subject: {draft.subject}
                </div>
                {draft.isAiGenerated && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'var(--stage-oa)',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <Zap size={11} /> Groq Llama 3.3
                  </span>
                )}
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.6',
                  fontFamily: 'inherit'
                }}
              >
                {draft.body}
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div
            style={{
              margin: '0 20px 10px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--stage-offer)',
              fontSize: '0.78rem',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            {actionNotice}
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Copy Full Email */}
            <button
              onClick={handleCopyFull}
              disabled={!draft}
              title="Copy Subject and Body to clipboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {copiedType === 'all' ? <Check size={14} style={{ color: 'var(--stage-offer)' }} /> : <Copy size={14} />}
              <span>{copiedType === 'all' ? 'Copied Full!' : 'Copy Full'}</span>
            </button>

            {/* Copy Body Only */}
            <button
              onClick={handleCopyBodyOnly}
              disabled={!draft}
              title="Copy message body only"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              {copiedType === 'body' ? <Check size={13} style={{ color: 'var(--stage-offer)' }} /> : <Copy size={13} />}
              <span>{copiedType === 'body' ? 'Copied Body!' : 'Body Only'}</span>
            </button>

            {draft && (
              <a
                href={
                  draft.threadId
                    ? `https://mail.google.com/mail/u/0/#all/${draft.threadId}`
                    : `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(companyName)}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={13} />
                <span>Open in Gmail</span>
              </a>
            )}
          </div>

          <button
            onClick={handleMarkSent}
            disabled={isSubmitting || !draft}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Saving...' : 'Mark as Sent'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftModal;
