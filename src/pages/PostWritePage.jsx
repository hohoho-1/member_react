import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

export default function PostWritePage() {
  const { id } = useParams(); // id가 있으면 수정 모드
  const navigate = useNavigate();
  const isEditMode = !!id;

  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const [category, setCategory] = useState('FREE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!payload) { navigate('/login'); return; }
    if (isEditMode) loadPost();
  }, []);

  const loadPost = async () => {
    const res = await authFetch(`/api/posts/${id}`);
    if (res.ok) {
      const data = await res.json();
      // 본인 또는 관리자만 수정 가능
      if (data.authorId !== payload.userId && !isAdmin) {
        alert('수정 권한이 없습니다.');
        navigate(`/board/${id}`);
        return;
      }
      setCategory(data.category);
      setTitle(data.title);
      setContent(data.content);
      setIsPinned(data.pinned ?? false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setErrorMsg('내용을 입력해주세요.'); return; }

    setLoading(true);
    setErrorMsg('');

    const body = { category, title: title.trim(), content: content.trim(), isPinned: isAdmin && category === 'NOTICE' ? isPinned : false };
    const res = isEditMode
      ? await authFetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await authFetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (res.ok) {
      const data = await res.json();
      navigate(`/board/${data.id}`);
    } else {
      const data = await res.json();
      setErrorMsg(data.message || '저장에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">
            {isEditMode ? '✏️ 게시글 수정' : '✏️ 게시글 작성'}
          </h2>
          <button onClick={() => navigate(isEditMode ? `/board/${id}` : '/board')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            취소
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-8 space-y-5">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">카테고리</label>
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <button onClick={() => setCategory('NOTICE')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === 'NOTICE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  📢 공지사항
                </button>
              )}
              <button onClick={() => { setCategory('FREE'); setIsPinned(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === 'FREE' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                💬 자유게시판
              </button>

              {/* 핀 고정 체크박스 - 관리자 + 공지 선택 시만 표시 */}
              {isAdmin && category === 'NOTICE' && (
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

          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length} / 200</p>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 제출 버튼 */}
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
