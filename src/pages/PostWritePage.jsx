import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xlsx', 'xls'];

export default function PostWritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);

  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  // URL 파라미터로 초기 게시판 코드, 돌아갈 경로 수신
  const initialBoardCode = searchParams.get('boardCode') ?? 'FREE';
  const returnTo = decodeURIComponent(searchParams.get('returnTo') ?? '/community?scope=FREE');

  // 쓰기 가능한 게시판 목록 (API에서 로드)
  const [boards, setBoards] = useState([]);
  const [boardCode, setBoardCode] = useState(initialBoardCode);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 파일 관련 상태
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);

  // 현재 선택된 게시판 메타정보
  const currentBoard = boards.find(b => b.code === boardCode) ?? null;
  const isPinnableBoard   = currentBoard?.adminOnly ?? false;
  const allowAttachment   = currentBoard?.allowAttachment ?? true;
  const allowComment      = currentBoard?.allowComment ?? true;

  useEffect(() => {
    if (!payload) { navigate('/login'); return; }
    loadBoards();
    if (isEditMode) loadPost();
  }, []);

  // 글쓰기 가능한 게시판 로드 (전체 로드 후 권한 필터)
  const loadBoards = async () => {
    const res = await authFetch('/api/boards');
    if (!res.ok) return;
    const all = await res.json();
    // adminOnly 게시판은 관리자만 접근 가능
    const writable = all.filter(b => b.active && (!b.adminOnly || isAdmin));
    setBoards(writable);
    // 현재 선택된 boardCode가 목록에 없으면 첫 번째로 변경
    if (writable.length > 0 && !writable.find(b => b.code === boardCode)) {
      setBoardCode(writable[0].code);
    }
  };

  const loadPost = async () => {
    const [postRes, fileRes] = await Promise.all([
      authFetch(`/api/posts/${id}`),
      authFetch(`/api/posts/${id}/files`),
    ]);
    if (postRes.ok) {
      const data = await postRes.json();
      if (data.authorId !== payload.userId && !isAdmin) {
        alert('수정 권한이 없습니다.');
        navigate(`/board/${id}`);
        return;
      }
      setBoardCode(data.boardCode ?? data.category ?? 'FREE');
      setTitle(data.title);
      setContent(data.content);
      setIsPinned(data.pinned ?? false);
    }
    if (fileRes.ok) setExistingFiles(await fileRes.json());
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const totalCount = existingFiles.length - deletedFileIds.length + pendingFiles.length + selected.length;
    if (totalCount > MAX_FILES) {
      setErrorMsg(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`);
      return;
    }
    const invalid = selected.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return !ALLOWED_EXT.includes(ext) || f.size > MAX_SIZE;
    });
    if (invalid.length > 0) {
      setErrorMsg('허용되지 않는 파일 형식이거나 10MB를 초과하는 파일이 있습니다.');
      return;
    }
    setErrorMsg('');
    setPendingFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };

  const removePending = (idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExisting = (fileId) => setDeletedFileIds(prev => [...prev, fileId]);

  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setErrorMsg('내용을 입력해주세요.'); return; }

    setLoading(true);
    setErrorMsg('');

    const body = {
      boardCode,
      title: title.trim(),
      content: content.trim(),
      isPinned: isAdmin && isPinnableBoard ? isPinned : false,
    };

    const res = isEditMode
      ? await authFetch(`/api/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await authFetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.message || '저장에 실패했습니다.');
      setLoading(false);
      return;
    }

    const postData = await res.json();
    const postId = postData.id;

    // 수정 모드: 삭제할 파일 제거
    for (const fileId of deletedFileIds) {
      await authFetch(`/api/posts/${postId}/files/${fileId}`, { method: 'DELETE' });
    }

    // 새 파일 업로드
    if (pendingFiles.length > 0) {
      const formData = new FormData();
      pendingFiles.forEach(f => formData.append('files', f));
      await authFetch(`/api/posts/${postId}/files`, { method: 'POST', body: formData });
    }

    navigate(`/board/${postId}?scope=${boardCode}&returnTo=${encodeURIComponent(returnTo)}`);
    setLoading(false);
  };

  const activeExistingFiles = existingFiles.filter(f => !deletedFileIds.includes(f.id));
  const totalCount = activeExistingFiles.length + pendingFiles.length;

  // 게시판 그룹별 색상
  const getBoardBadge = (code) => {
    const map = {
      FREE: 'bg-blue-500 text-white',
      GALLERY: 'bg-purple-500 text-white',
      NOTICE: 'bg-red-500 text-white',
      FAQ: 'bg-green-500 text-white',
      QNA: 'bg-amber-500 text-white',
      SUGGESTION: 'bg-teal-500 text-white',
    };
    return map[code] ?? 'bg-gray-500 text-white';
  };

  return (
    <div className="bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">
            {isEditMode ? '✏️ 게시글 수정' : '✏️ 게시글 작성'}
          </h2>
          <button
            onClick={() => navigate(isEditMode ? `/board/${id}?scope=${boardCode}&returnTo=${encodeURIComponent(returnTo)}` : returnTo)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            취소
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-8 space-y-5">

          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">게시판</label>
            <div className="flex items-center gap-2 flex-wrap">
              {boards.map(board => (
                <button
                  key={board.code}
                  onClick={() => { setBoardCode(board.code); setIsPinned(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    boardCode === board.code
                      ? getBoardBadge(board.code)
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {board.name}
                </button>
              ))}

              {/* 관리자 + adminOnly 게시판: 상단 고정 체크박스 */}
              {isAdmin && isPinnableBoard && (
                <label className="flex items-center gap-2 ml-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-amber-600">📌 상단 고정</span>
                </label>
              )}
            </div>
          </div>

          {/* QnA / 건의사항 안내 문구 */}
          {(boardCode === 'QNA' || boardCode === 'SUGGESTION') && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
              boardCode === 'QNA'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
            }`}>
              <span className="text-lg leading-none mt-0.5">{boardCode === 'QNA' ? '💬' : '📬'}</span>
              <div>
                <p className="font-semibold mb-0.5">
                  {boardCode === 'QNA' ? 'Q&A 게시판' : '건의사항 게시판'}
                </p>
                <p>
                  {boardCode === 'QNA'
                    ? '질문을 남겨주시면 관리자가 검토 후 답변드립니다.'
                    : '건의사항을 남겨주시면 관리자가 검토 후 답변드립니다.'}
                </p>
              </div>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length} / 200</p>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
          </div>

          {/* 파일 첨부 */}
          {allowAttachment && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-600">
                📎 파일 첨부 <span className="text-gray-400 font-normal">({totalCount}/{MAX_FILES})</span>
              </label>
              {totalCount < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                  + 파일 선택
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-gray-400 mb-2">
              jpg, jpeg, png, gif, pdf, doc, docx, xlsx, xls / 파일당 최대 10MB
            </p>

            {/* 기존 파일 (수정 모드) */}
            {activeExistingFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg mb-1">
                <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                  <span>{file.image ? '🖼️' : '📄'}</span>
                  <span className="truncate">{file.originalName}</span>
                  <span className="text-xs text-gray-400 shrink-0">({(file.fileSize / 1024).toFixed(1)}KB)</span>
                </div>
                <button onClick={() => removeExisting(file.id)}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
              </div>
            ))}

            {/* 새로 선택한 파일 */}
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-950 rounded-lg mb-1">
                <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                  <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)}KB)</span>
                  <span className="text-xs text-green-500 shrink-0">NEW</span>
                </div>
                <button onClick={() => removePending(idx)}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
              </div>
            ))}

            {totalCount === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
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
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? '저장 중...' : isEditMode ? '수정 완료' : '작성 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
