import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import GalleryLightbox from './GalleryLightbox';
import { SkeletonPostList } from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

const PAGE_SIZE = 10;

function FaqItem({ post, defaultOpen = false, canEdit = false, onDelete, onUpdated }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, content: post.content ?? '' });
  const [saving, setSaving] = useState(false);
  const isNew = (Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  const { confirmProps: faqConfirmProps, confirm: faqConfirm } = useConfirm();

  const handleEditSave = async (e) => {
    e.stopPropagation();
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await authFetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardCode: post.boardCode, title: editForm.title, content: editForm.content, isPinned: false }),
    });
    setSaving(false);
    if (res.ok) { setEditing(false); onUpdated?.(); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const ok = await faqConfirm({ title: 'FAQ 삭제', message: `'${post.title}' FAQ를 삭제하시겠습니까?`, confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) onDelete?.();
  };

  return (
    <>
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-green-300 dark:border-green-700 shadow-sm' : 'border-gray-200 dark:border-gray-700'}`}>
      <div
        onClick={() => { if (!editing) setOpen(v => !v); }}
        className={`w-full flex items-start justify-between gap-3 px-5 py-4 text-left transition-colors cursor-pointer ${open ? 'bg-green-50 dark:bg-green-950' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">Q</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">{post.title}</span>
            {isNew && <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
          {canEdit && (
            <>
              <button onClick={e => { e.stopPropagation(); setEditing(v => !v); setOpen(true); }}
                className="px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-500 rounded transition-colors">수정</button>
              <button onClick={handleDelete}
                className="px-2 py-0.5 text-xs bg-red-50 hover:bg-red-100 text-red-400 rounded transition-colors">삭제</button>
            </>
          )}
          <span className={`text-green-500 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌄</span>
        </div>
      </div>

      {open && (
        <div className="bg-white dark:bg-gray-800 border-t border-green-100 dark:border-green-900">
          {editing ? (
            <div className="px-5 py-4 space-y-3" onClick={e => e.stopPropagation()}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">질문 (제목)</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">답변 (내용)</label>
                <textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                  rows={4} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-green-400 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditSave} disabled={saving}
                  className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors">
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button onClick={e => { e.stopPropagation(); setEditing(false); }}
                  className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs font-bold flex items-center justify-center">A</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
          )}
        </div>
      )}
    </div>
    <ConfirmModal {...faqConfirmProps} />
    </>
  );
}

export default function BoardListPage({ groupKey, groupLabel, groupEmoji, boards, basePath }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const scope       = searchParams.get('scope') ?? boards[0]?.code ?? 'ALL';
  const keyword     = searchParams.get('keyword') ?? '';
  const sort        = searchParams.get('sort') ?? 'latest';
  const openPostId  = parseInt(searchParams.get('open') ?? '0', 10) || null;
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1', 10) - 1) || 0;

  const [posts, setPosts]               = useState([]);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const payload    = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin    = payload?.role === 'ROLE_ADMIN';

  const currentBoard   = boards.find(b => b.code === scope) ?? null;
  const isFaqBoard     = currentBoard?.boardType === 'FAQ';
  const isGalleryBoard = currentBoard?.boardType === 'GALLERY';
  const isQnaBoard     = currentBoard?.boardType === 'QNA';
  const allowComment   = currentBoard?.allowComment ?? true;
  const canWrite       = isLoggedIn && (currentBoard ? (!currentBoard.adminOnly || isAdmin) : false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ scope, keyword, sort, page: String(currentPage), size: String(PAGE_SIZE) });
    const res = await authFetch(`/api/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts); setTotalPages(data.totalPages); setTotalElements(data.totalElements);
    }
    setLoading(false);
  }, [scope, keyword, sort, currentPage]);

  useEffect(() => { loadPosts(); setLightboxIndex(null); }, [loadPosts]);

  const setParam = (updates) => {
    const next = { scope, sort };
    if (keyword) next.keyword = keyword;
    const merged = { ...next, ...updates };
    Object.keys(merged).forEach(k => merged[k] === undefined && delete merged[k]);
    setSearchParams(merged);
  };

  const switchScope = (s) => setSearchParams({ scope: s, sort });
  const switchSort  = (s) => setParam({ sort: s, page: undefined });
  const goToPage    = (p) => {
    const params = { scope, sort };
    if (keyword) params.keyword = keyword;
    if (p > 0) params.page = String(p + 1);
    setSearchParams(params);
  };
  const [keywordInput, setKeywordInput] = useState(keyword);

  const applyKeyword = (kw) => {
    const params = { scope, sort };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

  const goToDetail = (postId) => navigate(
    `/board/${postId}?scope=${scope}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`
  );

  const getBadgeColor = (code) => {
    const map = {
      NOTICE: 'bg-red-100 text-red-600', FREE: 'bg-blue-100 text-blue-600',
      GALLERY: 'bg-purple-100 text-purple-600', QNA: 'bg-amber-100 text-amber-700',
      FAQ: 'bg-green-100 text-green-700', SUGGESTION: 'bg-teal-100 text-teal-700',
    };
    return map[code] ?? 'bg-gray-100 text-gray-600';
  };

  const renderPagination = () => (
    <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">‹</button>
      {Array.from({ length: totalPages }, (_, i) => i).map(num => (
        <button key={num} onClick={() => goToPage(num)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}>
          {num + 1}
        </button>
      ))}
      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">›</button>
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100">{groupEmoji} {groupLabel}</h2>
          {canWrite ? (
            <button onClick={() => navigate(`/board/write?boardCode=${scope}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              ✏️ 글쓰기
            </button>
          ) : !isLoggedIn ? (
            <button onClick={() => navigate('/login', { state: { from: { pathname: `/board/write`, search: `?boardCode=${scope}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}` } } })}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium transition-colors">
              ✏️ 글쓰기
            </button>
          ) : null}
        </div>

        {/* 게시판 탭 */}
        <div className="flex mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
          {boards.filter(b => b.active !== false).map(board => (
            <button key={board.code} onClick={() => switchScope(board.code)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                scope === board.code ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {board.name}
              {board.adminOnly && <span className="ml-1 text-[10px] opacity-70">(공지)</span>}
            </button>
          ))}
        </div>

        {/* ── FAQ 아코디언 뷰 ── */}
        {isFaqBoard ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-200">총 {totalElements}개 FAQ</span>
              <div className="relative">
                <input type="text" placeholder="🔍 FAQ 검색" value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyKeyword(keywordInput); }}
                  className="px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-green-400 w-48" />
                {keywordInput && (
                  <button onClick={() => { setKeywordInput(''); setSearchParams({ scope, sort }); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none">✕</button>
                )}
                <button onClick={() => applyKeyword(keywordInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 text-base leading-none">🔍</button>
              </div>
            </div>
            {loading ? <SkeletonPostList count={5} /> : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">등록된 FAQ가 없습니다.</div>
            ) : (
              <div className="p-5 space-y-3">
                {posts.map(post => (
                  <FaqItem key={post.id} post={post} defaultOpen={openPostId === post.id}
                    canEdit={isAdmin || payload?.userId === post.authorId}
                    onDelete={loadPosts} onUpdated={loadPosts} />
                ))}
              </div>
            )}
            {!loading && totalPages > 1 && renderPagination()}
          </div>

        ) : (
          /* ── 일반 / 갤러리 뷰 ── */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {/* 툴바 */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
              {/* 정렬 버튼 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  총 {totalElements}개
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">({currentPage + 1} / {totalPages || 1} 페이지)</span>
                </span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { value: 'latest', label: '최신순' },
                    { value: 'views', label: '👁️ 조회순' },
                    { value: 'likes', label: '❤️ 좋아요순' },
                    ...(allowComment ? [{ value: 'comments', label: '💬 댓글순' }] : []),
                  ].map(s => (
                    <button key={s.value} onClick={() => switchSort(s.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        sort === s.value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 검색창 */}
              <div className="relative">
                <input type="text" placeholder="검색어 입력 후 Enter"
                  value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyKeyword(keywordInput); }}
                  className="w-full sm:w-56 px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400" />
                {keywordInput && (
                  <button onClick={() => { setKeywordInput(''); setSearchParams({ scope, sort }); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none">✕</button>
                )}
                <button onClick={() => applyKeyword(keywordInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 text-base leading-none">🔍</button>
              </div>
            </div>

            {loading ? <SkeletonPostList count={5} /> : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">게시글이 없습니다.</div>

            ) : isGalleryBoard ? (
              <>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {posts.map((post, i) => (
                    <div key={post.id}
                      className="cursor-pointer rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                      onClick={() => setLightboxIndex(i)}>
                      <div className="aspect-square bg-gray-100 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {post.thumbnailUrl ? (
                          <img src={`http://localhost:8080${post.thumbnailUrl}`} alt={post.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-4xl text-gray-300 ${post.thumbnailUrl ? 'hidden' : ''}`}>🖼️</div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate leading-snug">{post.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">{post.authorName}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
                            {allowComment && post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
                          </div>
                        </div>
                        {(Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                          <span className="inline-block mt-1 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">NEW</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && renderPagination()}
                <GalleryLightbox posts={posts} index={lightboxIndex}
                  onClose={() => setLightboxIndex(null)} onNavigate={i => setLightboxIndex(i)}
                  onGoDetail={postId => { setLightboxIndex(null); goToDetail(postId); }}
                  allowComment={allowComment} />
              </>

            ) : (
              <>
                {/* ── 데스크탑: 테이블 뷰 ── */}
                <table className="hidden sm:table w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['번호', '게시판', '제목', '작성자', '날짜', '조회', '❤️', ...(allowComment ? ['💬'] : [])].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, index) => {
                      const prevPost = posts[index - 1];
                      const isFirstUnpinned = !post.pinned && (index === 0 || prevPost?.pinned === true);
                      const isPinned = post.pinned;
                      return (
                        <>
                          {isFirstUnpinned && index > 0 && (
                            <tr key={`divider-${post.id}`}>
                              <td colSpan={allowComment ? 8 : 7}>
                                <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 mx-4 my-0.5" />
                              </td>
                            </tr>
                          )}
                          <tr key={post.id}
                            className={`border-t border-gray-50 dark:border-gray-700 cursor-pointer transition-colors ${
                              isPinned
                                ? 'bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => goToDetail(post.id)}>
                            <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                              {isPinned ? <span className="text-amber-500 font-bold">📌</span> : post.id}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(post.boardCode)}`}>{post.boardName}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{post.title}</span>
                                {(Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>
                                )}
                                {isQnaBoard && (
                                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'}`}>
                                    {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{post.authorName}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</td>
                            <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{post.viewCount}</td>
                            <td className="px-4 py-3 text-sm text-red-400">{post.likeCount > 0 ? post.likeCount : '-'}</td>
                            {allowComment && (
                              <td className="px-4 py-3 text-sm text-blue-400">{post.commentCount > 0 ? post.commentCount : '-'}</td>
                            )}
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>

                {/* ── 모바일: 카드 리스트 뷰 ── */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {posts.map((post, index) => {
                    const prevPost = posts[index - 1];
                    const isFirstUnpinned = !post.pinned && (index === 0 || prevPost?.pinned === true);
                    const isPinned = post.pinned;
                    const isNew = (Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000;
                    return (
                      <>
                        {isFirstUnpinned && index > 0 && (
                          <div key={`divider-${post.id}`} className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 mx-4" />
                        )}
                        <div key={post.id}
                          onClick={() => goToDetail(post.id)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            isPinned
                              ? 'bg-amber-50 dark:bg-amber-950'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}>
                          {/* 첫 줄: 배지 + 제목 + NEW */}
                          <div className="flex items-start gap-2 mb-1.5">
                            {isPinned
                              ? <span className="shrink-0 text-amber-500 text-sm mt-0.5">📌</span>
                              : <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-0.5 ${getBadgeColor(post.boardCode)}`}>{post.boardName}</span>
                            }
                            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug line-clamp-2">
                              {post.title}
                            </span>
                            {isNew && <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded mt-0.5">NEW</span>}
                            {isQnaBoard && (
                              <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded mt-0.5 ${post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'}`}>
                                {post.answerCount > 0 ? '✅' : '⏳'}
                              </span>
                            )}
                          </div>
                          {/* 둘째 줄: 작성자 · 날짜 · 조회 · 좋아요 · 댓글 */}
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
                            <span>{post.authorName}</span>
                            <span>·</span>
                            <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                            {post.viewCount > 0 && <><span>·</span><span>👁 {post.viewCount}</span></>}
                            {post.likeCount > 0 && <span className="text-red-400">❤️ {post.likeCount}</span>}
                            {allowComment && post.commentCount > 0 && <span className="text-blue-400">💬 {post.commentCount}</span>}
                          </div>
                        </div>
                      </>
                    );
                  })}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
