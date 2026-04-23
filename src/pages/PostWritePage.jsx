import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import { useDraft } from '../hooks/useDraft';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xlsx', 'xls'];

function formatSavedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PostWritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);

  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const initialBoardCode = searchParams.get('boardCode') ?? 'FREE';
  const returnTo = decodeURIComponent(searchParams.get('returnTo') ?? '/community?scope=FREE');

  const [boards, setBoards] = useState([]);
  const [boardCode, setBoardCode] = useState(initialBoardCode);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);

  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftToast, setDraftToast] = useState(null);
  const [draftRestoreData, setDraftRestoreData] = useState(null);
  const toastTimer = useRef(null);

  const { loadDraft, saveDraft, clearDraft } = useDraft({ boardCode, title, content, isEditMode });

  const currentBoard = boards.find(b => b.code === boardCode) ?? null;
  const isPinnableBoard = currentBoard?.adminOnly ?? false;
  const allowAttachment = currentBoard?.allowAttachment ?? true;

  useEffect(() => {
    if (!payload) { navigate('/login'); return; }
    loadBoards();
    if (isEditMode) loadPost();
    // eslint-disable-next-line
  }, []);

  const loadBoards = async () => {
    const res = await authFetch('/api/boards');
    if (!res.ok) return;
    const all = await res.json();
    const writable = all.filter(b => b.active && (!b.adminOnly || isAdmin));
    setBoards(writable);
    if (writable.length > 0 && !writable.find(b => b.code === boardCode)) setBoardCode(writable[0].code);
    if (!isEditMode) {
      const draft = loadDraft(initialBoardCode);
      if (draft && (draft.title?.trim() || draft.content?.trim())) {
        setDraftRestoreData(draft);
        showToast('restore');
      }
    }
  };

  const loadPost = async () => {
    const [postRes, fileRes] = await Promise.all([authFetch(`/api/posts/${id}`), authFetch(`/api/posts/${id}/files`)]);
    if (postRes.ok) {
      const data = await postRes.json();
      if (data.authorId !== payload.userId && !isAdmin) { alert('수정 권한이 없습니다.'); navigate(`/board/${id}`); return; }
      setBoardCode(data.boardCode ?? data.category ?? 'FREE');
      setTitle(data.title); setContent(data.content); setIsPinned(data.pinned ?? false);
    }
    if (fileRes.ok) setExistingFiles(await fileRes.json());
  };

  const showToast = useCallback((type, duration = 0) => {
    clearTimeout(toastTimer.current);
    setDraftToast(type);
    if (duration > 0) toastTimer.current = setTimeout(() => setDraftToast(null), duration);
  }, []);

  const handleManualSave = () => {
    const savedAt = saveDraft();
    if (savedAt) { setDraftSavedAt(savedAt); showToast('saved', 2500); }
  };

  useEffect(() => {
    if (isEditMode) return;
    const timer = setInterval(() => {
      if (title.trim() || content.trim()) { const savedAt = saveDraft(); if (savedAt) setDraftSavedAt(savedAt); }
    }, 30_000);
    return () => clearInterval(timer);
  }, [isEditMode, title, content, saveDraft]);

  const handleRestoreDraft = () => {
    if (!draftRestoreData) return;
    setTitle(draftRestoreData.title ?? ''); setContent(draftRestoreData.content ?? '');
    setBoardCode(draftRestoreData.boardCode ?? boardCode); setDraftSavedAt(draftRestoreData.savedAt);
    setDraftRestoreData(null); setDraftToast(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(draftRestoreData?.boardCode ?? boardCode);
    setDraftRestoreData(null); setDraftToast(null);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const totalCount = existingFiles.length - deletedFileIds.length + pendingFiles.length + selected.length;
    if (totalCount > MAX_FILES) { setErrorMsg(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`); return; }
    const invalid = selected.filter(f => { const ext = f.name.split('.').pop().toLowerCase(); return !ALLOWED_EXT.includes(ext) || f.size > MAX_SIZE; });
    if (invalid.length > 0) { setErrorMsg('허용되지 않는 파일 형식이거나 10MB를 초과하는 파일이 있습니다.'); return; }
    setErrorMsg(''); setPendingFiles(prev => [...prev, ...selected]); e.target.value = '';
  };

  const removePending = (idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExisting = (fileId) => setDeletedFileIds(prev => [...prev, fileId]);

  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setErrorMsg('내용을 입력해주세요.'); return; }
    setLoading(true); setErrorMsg('');
    const body = { boardCode, title: title.trim(), content: content.trim(), isPinned: isAdmin && isPinnableBoard ? isPinned : false };
    const res = isEditMode
      ? await authFetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await authFetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const data = await res.json(); setErrorMsg(data.message || '저장에 실패했습니다.'); setLoading(false); return; }
    const postData = await res.json(); const postId = postData.id;
    for (const fileId of deletedFileIds) await authFetch(`/api/posts/${postId}/files/${fileId}`, { method: 'DELETE' });
    if (pendingFiles.length > 0) { const formData = new FormData(); pendingFiles.forEach(f => formData.append('files', f)); await authFetch(`/api/posts/${postId}/files`, { method: 'POST', body: formData }); }
    clearDraft(boardCode);
    navigate(`/board/${postId}?scope=${boardCode}&returnTo=${encodeURIComponent(returnTo)}`);
    setLoading(false);
  };

  const handleCancel = () => {
    if (!isEditMode && (title.trim() || content.trim())) { const savedAt = saveDraft(); if (savedAt) setDraftSavedAt(savedAt); }
    navigate(isEditMode ? `/board/${id}?scope=${boardCode}&returnTo=${encodeURIComponent(returnTo)}` : returnTo);
  };

  const activeExistingFiles = existingFiles.filter(f => !deletedFileIds.includes(f.id));
  const totalCount = activeExistingFiles.length + pendingFiles.length;

  const getBoardBadge = (code) => {
    const map = { FREE: 'bg-blue-500 text-white', GALLERY: 'bg-purple-500 text-white', NOTICE: 'bg-red-500 text-white', FAQ: 'bg-green-500 text-white', QNA: 'bg-amber-500 text-white', SUGGESTION: 'bg-teal-500 text-white' };
    return map[code] ?? 'bg-gray-500 text-white';
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto px-0 sm:px-4">

        {/* 임시저장 복원 토스트 */}
        {draftToast === 'restore' && draftRestoreData && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm">
            <div className="text-2xl shrink-0 mt-0.5">📝</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">임시저장된 글이 있습니다</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {formatSavedAt(draftRestoreData.savedAt)} 저장 —{' '}
                <span className="font-medium">
                  {draftRestoreData.title ? `"${draftRestoreData.title.slice(0, 30)}${draftRestoreData.title.length > 30 ? '...' : ''}"` : '(제목 없음)'}
                </span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleRestoreDraft}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">
                불러오기
              </button>
              <button onClick={handleDiscardDraft}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium transition-colors">
                무시
              </button>
            </div>
          </div>
        )}

        {/* 저장 완료 토스트 */}
        {draftToast === 'saved' && (
          <div className="mb-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <span className="text-green-500 text-lg">✅</span>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">임시저장 완료</p>
            <span className="text-xs text-green-500 dark:text-green-400 ml-auto">{formatSavedAt(draftSavedAt)}</span>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
              {isEditMode ? '✏️ 게시글 수정' : '✏️ 게시글 작성'}
            </h2>
            {!isEditMode && draftSavedAt && draftToast !== 'saved' && (
              <span className="text-xs text-gray-400 dark:text-gray-500">🕐 {formatSavedAt(draftSavedAt)} 자동저장</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button onClick={handleManualSave} disabled={!title.trim() && !content.trim()}
                className="px-3 py-2 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-amber-600 dark:text-amber-400 disabled:text-gray-300 dark:disabled:text-gray-600 border border-amber-200 dark:border-amber-800 disabled:border-gray-200 dark:disabled:border-gray-700 rounded-lg text-xs font-medium transition-colors">
                💾 임시저장
              </button>
            )}
            <button onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
              취소
            </button>
          </div>
        </div>

        {/* 본문 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 space-y-5">

          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">게시판</label>
            <div className="flex items-center gap-2 flex-wrap">
              {boards.map(board => (
                <button key={board.code} onClick={() => { setBoardCode(board.code); setIsPinned(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    boardCode === board.code ? getBoardBadge(board.code) : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {board.name}
                </button>
              ))}
              {isAdmin && isPinnableBoard && (
                <label className="flex items-center gap-2 ml-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                  <span className="text-sm font-medium text-amber-600">📌 상단 고정</span>
                </label>
              )}
            </div>
          </div>

          {/* QnA / 건의사항 안내 */}
          {(boardCode === 'QNA' || boardCode === 'SUGGESTION') && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
              boardCode === 'QNA'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
            }`}>
              <span className="text-lg leading-none mt-0.5">{boardCode === 'QNA' ? '💬' : '📬'}</span>
              <div>
                <p className="font-semibold mb-0.5">{boardCode === 'QNA' ? 'Q&A 게시판' : '건의사항 게시판'}</p>
                <p>{boardCode === 'QNA' ? '질문을 남겨주시면 관리자가 검토 후 답변드립니다.' : '건의사항을 남겨주시면 관리자가 검토 후 답변드립니다.'}</p>
              </div>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요" maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{title.length} / 200</p>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요" rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors resize-none" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{content.length} 자</p>
          </div>

          {/* 파일 첨부 */}
          {allowAttachment && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  📎 파일 첨부 <span className="text-gray-400 dark:text-gray-500 font-normal">({totalCount}/{MAX_FILES})</span>
                </label>
                {totalCount < MAX_FILES && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors">
                    + 파일 선택
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xlsx,.xls" onChange={handleFileSelect} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">jpg, jpeg, png, gif, pdf, doc, docx, xlsx, xls / 파일당 최대 10MB</p>
              {activeExistingFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg mb-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 truncate">
                    <span>{file.image ? '🖼️' : '📄'}</span>
                    <span className="truncate">{file.originalName}</span>
                    <span className="text-xs text-gray-400 shrink-0">({(file.fileSize / 1024).toFixed(1)}KB)</span>
                  </div>
                  <button onClick={() => removeExisting(file.id)} className="ml-2 text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                </div>
              ))}
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-950 rounded-lg mb-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 truncate">
                    <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)}KB)</span>
                    <span className="text-xs text-green-500 shrink-0">NEW</span>
                  </div>
                  <button onClick={() => removePending(idx)} className="ml-2 text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                </div>
              ))}
              {totalCount === 0 && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-400 dark:text-gray-500">
                  첨부 파일 없음
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? '저장 중...' : isEditMode ? '수정 완료' : '작성 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
