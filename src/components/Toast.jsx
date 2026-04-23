import { useState, useCallback, useEffect, useRef } from 'react';

// ── 아이콘 ─────────────────────────────────────────────
const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const BG = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
  error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  info:    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
};

// ── 개별 Toast 아이템 ──────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount 후 fade-in
    const t1 = setTimeout(() => setVisible(true), 10);
    // duration 후 fade-out → 제거
    const t2 = setTimeout(() => setVisible(false), toast.duration - 300);
    const t3 = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [toast, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
      className={`
        flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg cursor-pointer
        transition-all duration-300 max-w-sm w-full
        ${BG[toast.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
      <span className="text-base shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
}

// ── ToastContainer (Layout에 마운트) ───────────────────
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// ── useToast 훅 ────────────────────────────────────────
let _idCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = ++_idCounter;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message, duration = 3000) => toast({ message, type: 'success', duration }), [toast]);
  const error   = useCallback((message, duration = 3500) => toast({ message, type: 'error',   duration }), [toast]);
  const warning = useCallback((message, duration = 3000) => toast({ message, type: 'warning', duration }), [toast]);
  const info    = useCallback((message, duration = 3000) => toast({ message, type: 'info',    duration }), [toast]);

  return { toasts, remove, toast, success, error, warning, info };
}
