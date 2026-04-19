import { useState, useCallback } from 'react';

/**
 * useConfirm — ConfirmModal을 간편하게 사용하기 위한 훅
 *
 * const { confirmProps, confirm } = useConfirm();
 * await confirm({ title, message, confirmText, confirmColor })
 *   → true (확인) / false (취소)
 *
 * JSX에 <ConfirmModal {...confirmProps} /> 추가 필요
 */
export function useConfirm() {
  const [state, setState] = useState({ isOpen: false, title: '', message: '', confirmText: '확인', confirmColor: 'blue', resolve: null });

  const confirm = useCallback(({ title = '', message = '', confirmText = '확인', confirmColor = 'blue' } = {}) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, confirmText, confirmColor, resolve });
    });
  }, []);

  const confirmProps = {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    confirmColor: state.confirmColor,
    onConfirm: () => { setState(s => ({ ...s, isOpen: false })); state.resolve(true); },
    onCancel:  () => { setState(s => ({ ...s, isOpen: false })); state.resolve(false); },
  };

  return { confirmProps, confirm };
}
