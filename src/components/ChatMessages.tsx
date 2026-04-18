import { useState } from 'react';
import { Copy, Share2, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import { MarkdownMessage } from './MarkdownMessage';
import type { BeaconMessage } from '../lib/types';

interface ChatMessagesProps {
  messages: BeaconMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const { t } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const canShare = typeof navigator.share === 'function';

  function handleCopy(message: BeaconMessage): void {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }

  function handleShare(text: string): void {
    navigator.share({ text }).catch(() => {});
  }

  return (
    <>
      {messages.map((message) => (
        <article key={message.id} className={`message ${message.sender}`}>
          {message.isAuthoritative && !message.isStreaming && (
            <div className="authoritative-badge">
              <ShieldCheck size={14} />
              {t('badge.authoritative')}
            </div>
          )}
          {message.sender === 'ai' ? (
            <MarkdownMessage text={message.text} />
          ) : (
            <div className="message-text">{message.text}</div>
          )}
          {message.evidence && !message.isStreaming && message.evidence.authoritative.length > 0 && (
            <div className="evidence-panel">
              <div className="evidence-row">
                <span className="evidence-label">{t('evidence.source')}</span>
                <div className="evidence-chips">
                  {message.evidence.authoritative.map((item) => (
                    <span key={item.id} className="evidence-chip authority">
                      {item.source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {message.disclaimer && !message.isStreaming && (
            <div className="message-disclaimer">{message.disclaimer}</div>
          )}
          {message.sender === 'ai' && !message.isStreaming && (
            <div className="message-actions">
              <button
                className="message-action-btn"
                onClick={() => handleCopy(message)}
                type="button"
                aria-label={t('action.copy')}
              >
                <Copy size={14} />
                <span>{copiedId === message.id ? t('action.copied') : t('action.copy')}</span>
              </button>
              {canShare && (
                <button
                  className="message-action-btn"
                  onClick={() => handleShare(message.text)}
                  type="button"
                  aria-label={t('action.share')}
                >
                  <Share2 size={14} />
                  <span>{t('action.share')}</span>
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </>
  );
}
