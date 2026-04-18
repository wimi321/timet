import { useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Camera as CameraIcon, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

interface ChatInputBarProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  onVisualAnalysis: () => void;
  onToggleModelManager: () => void;
  isStreaming: boolean;
}

const MAX_HEIGHT = 128;

function resetTextareaHeight(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px';
}

export function ChatInputBar({
  chatInput,
  onChatInputChange,
  onSubmit,
  onVisualAnalysis,
  onToggleModelManager,
  isStreaming,
}: ChatInputBarProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && chatInput === '') {
      textareaRef.current.style.height = 'auto';
    }
  }, [chatInput]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (chatInput.trim() && !isStreaming) {
        onSubmit();
      }
    }
  }

  return (
    <div className="fixed-bottom-panel">
      <form className="chat-input-wrapper" onSubmit={(event) => { event.preventDefault(); onSubmit(event); }}>
        <textarea
          ref={textareaRef}
          className="chat-input"
          rows={1}
          placeholder={t('chat.input_placeholder')}
          value={chatInput}
          onChange={(event) => {
            onChatInputChange(event.target.value);
            resetTextareaHeight(event.target);
          }}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <button className="send-btn" type="submit" disabled={isStreaming}>
          {t('chat.send')}
        </button>
      </form>

      <div className="bottom-toolbar">
        <button className="tool-btn" onClick={onVisualAnalysis} type="button">
          <CameraIcon size={18} />
          <span>{t('action.visual_help')}</span>
        </button>
        <button
          className="model-mgr-btn"
          onClick={onToggleModelManager}
          aria-label={t('model.manage')}
          title={t('model.manage')}
          type="button"
        >
          <Settings size={18} />
          <span>{t('model.manage')}</span>
        </button>
      </div>
    </div>
  );
}
