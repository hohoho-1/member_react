import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

const PAGE_SIZE = 10;

/**
 * 게시판 목록 공통 컴포넌트
 * @param {string}   groupKey      - "COMMUNITY" | "SUPPORT"
 * @param {string}   groupLabel    - 헤더에 표시할 이름 (예: "커뮤니티")
 * @param {string}   groupEmoji    - 헤더 이모지
 * @param {Array}    boards        - 해당 그룹 게시판 목록 [{code, name, adminOnly, boardType}]
 * @param {string}   basePath      - 이 페이지의 경로 (예: "/community")
 */
export default function BoardListPage({ groupKey, groupLabel, groupEmoji, boards, basePath }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const scope     = searchParams.get('scope') ?? boards[0]?.code ?? 'ALL';
  const keyword   = searchParams.get('keyword') ?? '';
  const sort      = searchParams.get('sort') ?? 'latest';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  // 현재 선택된 게시판 정보
  const currentBoard = boards.find(b => b.code === scope) ?? null;
  // 글쓰기 가능 여부: adminOnly면 관리자만, 그 외는 로그인 유저
  const canWrite = isLoggedIn && (currentBoard ? (!currentBoard.adminOnly || isAdmin) : false);

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
  const handleKeywordChange = (e) => {
    const kw = e.target.value;
    const params = { scope, sort };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

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

        {/* 게시글 목록 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">
                총 {totalElements}개
                <span className="ml-2 text-sm text-gray-400">
                  ({currentPage + 1} / {totalPages || 1} 페이지)
                </span>
              </span>
              <div className="flex gap-1">
                {[
                  { value: 'latest',   label: '최신순' },
                  { value: 'views',    label: '👁️ 조회순' },
                  { value: 'likes',    label: '❤️ 좋아요순' },
                  { value: 'comments', label: '💬 댓글순' },
                ].map(s => (
                  <button key={s.value} onClick={() => switchSort(s.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sort === s.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input type="text" placeholder="🔍 제목 또는 작성자 검색"
                value={keyword} onChange={handleKeywordChange}
                className="px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-52"
              />
              {keyword && (
                <button
                  onClick={() => setSearchParams(p => { p.set('keyword', ''); return p; })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
                >✕</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">
                {keyword ? '🔍' :
                 scope === 'NOTICE'     ? '📢' :
                 scope === 'FAQ'        ? '❓' :
                 scope === 'QNA'        ? '💬' :
                 scope === 'SUGGESTION' ? '📬' :
                 scope === 'GALLERY'    ? '🖼️' : '📝'}
              </div>
              <p className="font-medium text-gray-500">
                {keyword
                  ? `"${keyword}"에 해당하는 게시글이 없습니다.`
                  : scope === 'NOTICE'     ? '등록된 공지사항이 없습니다.'
                  : scope === 'FAQ'        ? '등록된 FAQ가 없습니다.'
                  : scope === 'QNA'        ? '아직 문의글이 없습니다. 궁금한 점을 질문해 보세요!'
                  : scope === 'SUGGESTION' ? '아직 건의사항이 없습니다. 의견을 자유롭게 남겨주세요!'
                  : scope === 'GALLERY'    ? '아직 사진이 없습니다. 첫 번째 사진을 올려보세요!'
                  : scope === 'FREE'       ? '아직 게시글이 없습니다. 첫 번째 글을 작성해 보세요!'
                  : '게시글이 없습니다.'}
              </p>
              {canWrite && !keyword && (
                <button
                  onClick={() => navigate(`/board/write?boardCode=${scope}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`)}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  글 작성하기
                </button>
              )}
            </div>
          ) : currentBoard?.boardType === 'GALLERY' ? (
            /* ── 갤러리 그리드 뷰 ── */
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {posts.map(post => (
                <div key={post.id}
                  className="cursor-pointer rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow bg-white"
                  onClick={() => navigate(
                    `/board/${post.id}?scope=${scope}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`
                  )}>
                  {/* 썸네일 */}
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
                  {/* 정보 */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 truncate leading-snug">{post.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{post.authorName}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
                        {post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
                      </div>
                    </div>
                    {(Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                      <span className="inline-block mt-1 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">NEW</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['번호', '게시판', '제목', '작성자', '날짜', '조회', '💬', '❤️'].map(h => (
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
                            <td colSpan={8}>
                              <div className="border-t-2 border-dashed border-gray-200 mx-4 my-0.5" />
                            </td>
                          </tr>
                        )}
                        <tr key={post.id}
                          className={`border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isPinned ? 'bg-amber-50 hover:bg-amber-100' : ''
                          }`}
                          onClick={() => navigate(
                            `/board/${post.id}?scope=${scope}&keyword=${encodeURIComponent(keyword)}&sort=${sort}&returnTo=${encodeURIComponent(`${basePath}?scope=${scope}`)}`
                          )}>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {isPinned
                              ? <span className="text-amber-500 font-bold">📌</span>
                              : post.id}
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
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{post.authorName}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">{post.viewCount}</td>
                          <td className="px-4 py-3 text-sm text-blue-400">{post.commentCount > 0 ? post.commentCount : '-'}</td>
                          <td className="px-4 py-3 text-sm text-red-400">{post.likeCount > 0 ? post.likeCount : '-'}</td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).map(num => (
                  <button key={num} onClick={() => goToPage(num)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {num + 1}
                  </button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">
                  ›
                </button>
              </div>
            </>
          )}
          {/* 갤러리/테이블 공통 페이지네이션 (갤러리 뷰) */}
          {!loading && posts.length > 0 && currentBoard?.boardType === 'GALLERY' && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i).map(num => (
                <button key={num} onClick={() => goToPage(num)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {num + 1}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
