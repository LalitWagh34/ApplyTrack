/**
 * Follow-Up Draft Modal
 * Generates tailored contextual email drafts with tone switches and 1-click clipboard copy
 */
import React, { useState, useEffect } from 'react';
import { followupsApi } from '../api/followupsApi.js';
import { FollowUpDraft } from '../types/followup.types.js';
import { Copy, Check, X, Send, Sparkles, ExternalLink, Zap } from 'lucide-react';

interface DraftModalProps {
  applicationId: string | null;
  companyName: string;
  roleTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onMarkSentSuccess: () => void;
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
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCopy = () => {
    if (!draft) return;
    void navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSent = async () => {
    if (!applicationId) return;
    setIsSubmitting(true);
    try {
      await followupsApi.markSent(applicationId, draft?.body);
      onMarkSentSuccess();
      onClose();
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
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tone Switchers */}
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: '8px' }}>
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
                color: tone === item.id ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Draft Content */}
        <div style={{ padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--accent)' }}>
                <Zap size={16} style={{ animation: 'pulse 1s infinite' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopy}
              disabled={!draft}
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
              {copied ? <Check size={14} style={{ color: 'var(--stage-offer)' }} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
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
              cursor: 'pointer'
            }}
          >
            <Send size={14} />
            <span>Mark as Sent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftModal;
