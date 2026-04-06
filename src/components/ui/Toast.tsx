/**
 * Minimal toast notification system (P-5).
 * No external dependencies — uses React state + CSS transitions only.
 *
 * Usage:
 *   const { toasts, showToast } = useToast();
 *   showToast('주문이 체결되었습니다', 'success');
 *   <ToastContainer toasts={toasts} />
 */
import { useState, useCallback, useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id:      number;
  message: string;
  variant: ToastVariant;
}

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, variant }]);
    // Auto-dismiss after 3.5 s
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismiss };
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-color-positive      text-white',
  error:   'bg-color-negative      text-white',
  info:    'bg-color-layer-4 border border-color-border text-color-text-2',
};

const ICON: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss?: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => onDismiss?.(t.id)}
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-lg shadow-lg
            text-small pointer-events-auto cursor-pointer
            animate-[slideIn_0.2s_ease-out]
            ${VARIANT_CLASSES[t.variant]}
          `}
        >
          <span className="font-bold text-base leading-none">{ICON[t.variant]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
