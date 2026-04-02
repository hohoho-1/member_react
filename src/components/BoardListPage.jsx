import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

const PAGE_SIZE = 10;

// ─── FAQ 아코디언 아이템 ──────────────────────────────────────────────────────
function FaqItem({ post }) {
  const [open, setOpen] = useState(false);
  const isNew = (Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-green-300 shadow-sm' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-start justify-between gap-3 px-5 py-4 text-left transition-colors ${open ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">Q</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700 leading-relaxed">{post.title}</span>
            {isNew && <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
          <span className={`text-green-500 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌄</span>
        </div>
      </button>
      {open && (
        <div className="bg-white border-t border-green-100">
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center">A</span>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 게시판 목록 공통 컴포넌트
 * @param {string}   groupKey      - "COMMUNITY" | "SUPPORT"
 * @param {string}   groupLabel    - 헤더에 표시할 이름
 * @param {string}   groupEmoji    - 헤더 이모지
 * @param {Array}    boards        - 해당 그룹 게시판 목록
 * @param {string}   basePath      - 이 페이지의 경로
 */
export default function BoardListPage({ groupKey, groupLabel, groupEmoji, boards, basePath }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const scope       = searchParams.get('scope') ?? boards[0]?.code ?? 'ALL';
  const keyword     = searchParams.get('keyword') ?? '';
  const sort        = searchParams.get('sort') ?? 'latest';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);

  const [posts, setPosts]               = useState([]);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]           = useState(true);

  const payload    = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin    = payload?.role === 'ROLE_ADMIN';

  // 현재 선택된 게시판 정보
  const currentBoard    = boards.find(b => b.code === scope) ?? null;
  const isFaqBoard      = currentBoard?.boardType === 'FAQ';
  const isGalleryBoard  = currentBoard?.boardType === 'GALLERY';
  const isQnaBoard      = currentBoard?.boardType === 'QNA';
  const allowComment    = currentBoard?.allowComment ?? true;
  const canWrite        = isLoggedIn && (currentBoard ? (!currentBoard.adminOnly || isAdmin) : false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      scope, keyword, sort, page: String(currentPage), size: String(PAGE_SIZE),
    });
    const res = await authFetch(`/api/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
    setLoading(false);
  }, [scope, keyword, sort, currentPage]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const setParam = (updates) => {
    const next = { scope, sort };
    if (keyword) next.keyword = keyword;
    setSearchParams({ ...next, ...updates });
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
  const isComposing = useRef(false);

  const applyKeyword = (kw) => {
    const params = { scope, sort };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

  const handleKeywordChange = (e) => {
    setKeywordInput(e.target.value);
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' && !isComposing.current) {
      applyKeyword(keywordInput);
    }
  };

  const goToDetail = (postId) => navigate(
    `/board/${postId}?scope=${scope}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`
  );

  // 뱃지 색상
  const getBadgeColor = (code) => {
    const map = {
      NOTICE:     'bg-red-100 text-red-600',
      FREE:       'bg-blue-100 text-blue-600',
      GALLERY:    'bg-purple-100 text-purple-600',
      QNA:        'bg-amber-100 text-amber-700',
      FAQ:        'bg-green-100 text-green-700',
      SUGGESTION: 'bg-teal-100 text-teal-700',
    };
    return map[code] ?? 'bg-gray-100 text-gray-600';
  };

  // 페이지네이션 공통 렌더
  const renderPagination = () => (
    <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
      {Array.from({ length: totalPages }, (_, i) => i).map(num => (
        <button key={num} onClick={() => goToPage(num)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}>
          {num + 1}
        </button>
      ))}
      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
    </div>
  );

  return (
    <div className="bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">{groupEmoji} {groupLabel}</h2>
          {canWrite && (
            <button
              onClick={() => navigate(`/board/write?boardCode=${scope}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              ✏️ 글쓰기
            </button>
          )}
        </div>

        {/* 게시판 탭 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          {boards.map(board => (
            <button key={board.code} onClick={() => switchScope(board.code)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                scope === board.code ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {board.name}
              {board.adminOnly && <span className="ml-1 text-[10px] opacity-70">(공지)</span>}
            </button>
          ))}
        </div>

        {/* ── FAQ 아코디언 뷰 ─────────────────────────────────────── */}
        {isFaqBoard ? (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* 상단 툴바 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-700">
                총 {totalElements}개 FAQ
              </span>
              <div className="relative">
                <input type="text" placeholder="🔍 FAQ 검색"
                  value={keywordInput} onChange={handleKeywordChange}
                  onKeyDown={handleKeywordKeyDown}
                  onCompositionStart={() => { isComposing.current = true; }}
                  onCompositionEnd={(e) => { isComposing.current = false; }}
                  className="px-3 py-2 pr-16 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-400 w-48"
                />
                {keywordInput && (
                  <button onClick={() => { setKeywordInput(''); setSearchParams({ scope, sort }); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none">✕</button>
                )}
                <button onClick={() => applyKeyword(keywordInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 text-base leading-none">🔍</button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">로딩 중...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">등록된 FAQ가 없습니다.</div>
            ) : (
              <div className="p-5 space-y-3">
                {posts.map(post => (
                  <FaqItem key={post.id} post={post} />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && renderPagination()}
          </div>

        ) : (
          /* ── 일반 / 갤러리 뷰 ─────────────────────────────────── */
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* 상단 툴바 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700">
                  총 {totalElements}개
                  <span className="ml-2 text-sm text-gray-400">
                    ({currentPage + 1} / {totalPages || 1} 페이지)
                  </span>
                </span>
                {/* 정렬 버튼 (갤러리도 지원) */}
                <div className="flex gap-1">
                  {[
                    { value: 'latest',   label: '최신순' },
                    { value: 'views',    label: '👁️ 조회순' },
                    { value: 'likes',    label: '❤️ 좋아요순' },
                    ...(allowComment ? [{ value: 'comments', label: '💬 댓글순' }] : []),
                  ].map(s => (
                    <button key={s.value} onClick={() => switchSort(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sort === s.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <input type="text" placeholder="검색어 입력 후 Enter 또는 🔍"
                  value={keywordInput} onChange={handleKeywordChange}
                  onKeyDown={handleKeywordKeyDown}
                  onCompositionStart={() => { isComposing.current = true; }}
                  onCompositionEnd={(e) => { isComposing.current = false; }}
                  className="px-3 py-2 pr-16 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-56"
                />
                {keywordInput && (
                  <button onClick={() => { setKeywordInput(''); setSearchParams({ scope, sort }); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none">✕</button>
                )}
                <button onClick={() => applyKeyword(keywordInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 text-base leading-none">🔍</button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">로딩 중...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">게시글이 없습니다.</div>

            ) : isGalleryBoard ? (
              /* ── 갤러리 그리드 ── */
              <>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {posts.map(post => (
                    <div key={post.id}
                      className="cursor-pointer rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow bg-white"
                      onClick={() => goToDetail(post.id)}>
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {post.thumbnailUrl ? (
                          <img
                            src={`http://localhost:8080${post.thumbnailUrl}`}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-4xl text-gray-300 ${post.thumbnailUrl ? 'hidden' : ''}`}>
                          🖼️
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 truncate leading-snug">{post.title}</p>
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
              </>

            ) : (
              /* ── 일반 테이블 뷰 ── */
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        '번호', '게시판', '제목', '작성자', '날짜', '조회',
                        ...(allowComment ? ['💬'] : []),
                        '❤️',
                      ].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
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
                                <div className="border-t-2 border-dashed border-gray-200 mx-4 my-0.5" />
                              </td>
                            </tr>
                          )}
                          <tr key={post.id}
                            className={`border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isPinned ? 'bg-amber-50 hover:bg-amber-100' : ''
                            }`}
                            onClick={() => goToDetail(post.id)}>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {isPinned ? <span className="text-amber-500 font-bold">📌</span> : post.id}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(post.boardCode)}`}>
                                {post.boardName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{post.title}</span>
                                {(Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>
                                )}
                                {/* QnA/건의사항 답변 상태 뱃지 */}
                                {isQnaBoard && (                                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    post.answerCount > 0
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{post.authorName}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">{post.viewCount}</td>
                            {allowComment && (
                              <td className="px-4 py-3 text-sm text-blue-400">{post.commentCount > 0 ? post.commentCount : '-'}</td>
                            )}
                            <td className="px-4 py-3 text-sm text-red-400">{post.likeCount > 0 ? post.likeCount : '-'}</td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {renderPagination()}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
