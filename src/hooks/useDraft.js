/**
 * useDraft — 게시글 임시저장 훅
 *
 * localStorage 키: `draft:{boardCode}` (게시판별 1개)
 * 구조: { boardCode, title, content, savedAt }
 *
 * 수정 모드(isEditMode=true)에서는 임시저장 비활성화
 */
import { useCallback, useEffect, useRef } from 'react';

const DRAFT_PREFIX = 'draft:';
const AUTO_SAVE_INTERVAL = 30_000; // 30초

export function useDraft({ boardCode, title, content, isEditMode }) {
  const autoSaveTimer = useRef(null);

  // 임시저장 키
  const getKey = useCallback((code) => `${DRAFT_PREFIX}${code}`, []);

  // 임시저장 불러오기
  const loadDraft = useCallback((code) => {
    if (isEditMode) return null;
    try {
      const raw = localStorage.getItem(getKey(code));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [isEditMode, getKey]);

  // 임시저장 저장
  const saveDraft = useCallback(() => {
    if (isEditMode) return;
    if (!title.trim() && !content.trim()) return; // 둘 다 비어있으면 저장 안 함
    try {
      const draft = { boardCode, title, content, savedAt: new Date().toISOString() };
      localStorage.setItem(getKey(boardCode), JSON.stringify(draft));
      return draft.savedAt;
    } catch {
      return null;
    }
  }, [isEditMode, boardCode, title, content, getKey]);

  // 임시저장 삭제
  const clearDraft = useCallback((code) => {
    try {
      localStorage.removeItem(getKey(code ?? boardCode));
    } catch {}
  }, [boardCode, getKey]);

  // 모든 게시판 임시저장 목록
  const listAllDrafts = useCallback(() => {
    const drafts = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) drafts.push(JSON.parse(raw));
        }
      }
    } catch {}
    return drafts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }, []);

  // 30초 자동저장 (내용이 있을 때만)
  useEffect(() => {
    if (isEditMode) return;
    autoSaveTimer.current = setInterval(() => {
      if (title.trim() || content.trim()) saveDraft();
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveTimer.current);
  }, [isEditMode, saveDraft, title, content]);

  return { loadDraft, saveDraft, clearDraft, listAllDrafts };
}
