import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const SECTION_SIZE = 3; // 전체 탭에서 섹션당 미리보기 개수
const PAGE_SIZE = 10;

const getBadgeClass = (code) => {
  const map = {
    NOTICE:     'bg-red-100 text-red-500',
    FREE:       'bg-blue-100 text-blue-500',
    GALLERY:    'bg-purple-100 text-purple-500',
    QNA:        'bg-amber-100 text-amber-600',
    FAQ:        'bg-green-100 text-green-600',
    SUGGESTION: 'bg-teal-100 text-teal-600',
  };
  return map[code] ?? 'bg-gray-100 text-gray-500';
};

const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="flex justify-center gap-1 py-4">
    <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">‹</button>
    {Array.from({ length: totalPages }, (_, i) => i).map(n => (
      <button key={n} onClick={() => onPageChange(n)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${n === page ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
        {n + 1}
      </button>
    ))}
    <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">›</button>
  </div>
);

// 게시글 행 공통 컴포넌트
function PostRow({ post, onClick }) {
  const isNew = (Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  return (
    <div className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
      onClick={onClick}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>
          {post.boardName}
        </span>
        <span className="text-sm font-medium text-gray-700 truncate">{post.title}</span>
        {isNew && <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>}
        {post.answerCount > 0 && (post.boardCode === 'QNA' || post.boardCode === 'SUGGESTION') && (
          <span className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">✅ 답변</span>
        )}
      </div>
      <div className="flex gap-3 text-xs text-gray-400">
        <span>✍️ {post.authorName}</span>
        <span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
        <span>👁️ {post.viewCount}</span>
        {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
        {post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') ?? '';
  const activeTab = searchParams.get('tab') ?? 'all';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);

  const [inputValue, setInputValue] = useState(keyword);
  const isComposing = useRef(false);
  const inputRef = useRef(null);

  // 전체 탭: 게시판별 섹션 데이터 { boardCode: { posts, total } }
  const [sections, setSections] = useState({});
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // 탭 탭: 단일 게시판 전체 결과
  const [tabPosts, setTabPosts] = useState([]);
  const [tabTotal, setTabTotal] = useState(0);
  const [tabTotalPages, setTabTotalPages] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);

  // 탭 목록: 전체 + 게시판별 검색 건수 (섹션과 별도로 항상 로드)
  const [tabCounts, setTabCounts] = useState({});
  const [tabCountsLoading, setTabCountsLoading] = useState(false);

  const [boards, setBoards] = useState([]);

  useEffect(() => {
    authFetch('/api/boards')
      .then(r => r.ok ? r.json() : [])
      .then(setBoards);
  }, []);

  // keyword 바뀔 때마다 게시판별 건수 로드 (탭 표시용)
  useEffect(() => {
    if (!keyword) { setTabCounts({}); return; }
    setTabCountsLoading(true);
    authFetch('/api/boards').then(r => r.ok ? r.json() : []).then(async (allBoards) => {
      const counts = {};
      await Promise.all(allBoards.map(async (board) => {
        const params = new URLSearchParams({ scope: board.code, keyword, page: '0', size: '1' });
        const res = await authFetch(`/api/posts?${params}`);
        if (res.ok) {
          const data = await res.json();
          counts[board.code] = data.totalElements;
        }
      }));
      setTabCounts(counts);
      setTabCountsLoading(false);
    });
  }, [keyword]);

  useEffect(() => {
    if (!keyword) { setSections({}); setTabPosts([]); return; }
    if (activeTab === 'all') loadAllSections();
    else loadTabPosts(currentPage);
  }, [keyword, activeTab, currentPage]);

  // 전체 탭: 게시판별로 각각 조회
  const loadAllSections = async () => {
    setSectionsLoading(true);
    const boardsRes = await authFetch('/api/boards');
    if (!boardsRes.ok) { setSectionsLoading(false); return; }
    const allBoards = await boardsRes.json();

    const results = {};
    await Promise.all(
      allBoards.map(async (board) => {
        const params = new URLSearchParams({ scope: board.code, keyword, page: '0', size: String(SECTION_SIZE) });
        const res = await authFetch(`/api/posts?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.totalElements > 0) {
            results[board.code] = {
              board,
              posts: data.posts,
              total: data.totalElements,
            };
          }
        }
      })
    );
    setSections(results);
    setSectionsLoading(false);
  };

  // 특정 게시판 탭: 페이지네이션 포함 전체 조회
  const loadTabPosts = async (page) => {
    setTabLoading(true);
    const params = new URLSearchParams({ scope: activeTab, keyword, page: String(page), size: String(PAGE_SIZE) });
    const res = await authFetch(`/api/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTabPosts(data.posts);
      setTabTotal(data.totalElements);
      setTabTotalPages(data.totalPages);
    }
    setTabLoading(false);
  };

  const handleSearch = (kw) => {
    if (!kw.trim()) return;
    setSearchParams({ keyword: kw.trim(), tab: 'all' });
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ keyword, tab: tabKey });
  };

  const goToPage = (page) => {
    setSearchParams({ keyword, tab: activeTab, ...(page > 0 ? { page: String(page + 1) } : {}) });
  };

  const goToDetail = (postId, boardCode, boardGroup) => {
    const returnTo = boardGroup === 'SUPPORT'
      ? `/support?scope=${boardCode}`
      : `/community?scope=${boardCode}`;
    navigate(`/board/${postId}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  // 탭 목록: 전체 + 결과 있는 게시판들
  const totalCount = Object.values(tabCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* 헤더 */}
        <h2 className="text-2xl font-bold text-gray-700 mb-6">🔍 통합검색</h2>

        {/* 검색창 */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onCompositionStart={() => { isComposing.current = true; }}
              onCompositionEnd={(e) => { isComposing.current = false; }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing.current) handleSearch(inputValue);
              }}
              placeholder="검색어를 입력하세요..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => handleSearch(inputValue)}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
              검색
            </button>
          </div>
          {keyword && (
            <p className="text-xs text-gray-400 mt-2 pl-1">
              <span className="font-semibold text-gray-600">"{keyword}"</span> 검색 결과
            </p>
          )}
        </div>

        {!keyword ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">🔍</p>
            <p>검색어를 입력해주세요.</p>
          </div>
        ) : (
          <>
            {/* 탭 */}
            <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden overflow-x-auto">
              <button
                onClick={() => handleTabChange('all')}
                className={`shrink-0 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'all' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                전체 {activeTab === 'all' && totalCount > 0 ? totalCount : ''}
              </button>
              {boards.filter(b => tabCounts[b.code] > 0).map(board => (
                <button
                  key={board.code}
                  onClick={() => handleTabChange(board.code)}
                  className={`shrink-0 px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === board.code ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {board.name} {tabCounts[board.code] > 0 ? tabCounts[board.code] : ''}
                </button>
              ))}
            </div>

            {/* 전체 탭 — 섹션별 나열 */}
            {activeTab === 'all' && (
              sectionsLoading ? (
                <div className="text-center py-20 text-gray-400">검색 중...</div>
              ) : Object.keys(sections).length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-3xl mb-3">📭</p>
                  <p>검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {boards
                    .filter(b => sections[b.code])
                    .map(board => {
                      const section = sections[board.code];
                      return (
                        <div key={board.code} className="bg-white rounded-2xl shadow overflow-hidden">
                          {/* 섹션 헤더 */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(board.code)}`}>
                                {board.name}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">{section.total}건</span>
                            </div>
                            {section.total > SECTION_SIZE && (
                              <button
                                onClick={() => handleTabChange(board.code)}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                                더보기 →
                              </button>
                            )}
                          </div>
                          {/* 게시글 목록 */}
                          <div>
                            {section.posts.map(post => (
                              <PostRow
                                key={post.id}
                                post={post}
                                onClick={() => goToDetail(post.id, post.boardCode, section.board.boardGroup)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )
            )}

            {/* 특정 게시판 탭 — 전체 결과 */}
            {activeTab !== 'all' && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                {tabLoading ? (
                  <div className="text-center py-20 text-gray-400">검색 중...</div>
                ) : tabPosts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-3xl mb-3">📭</p>
                    <p>검색 결과가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
                      총 <span className="font-semibold text-gray-700">{tabTotal}</span>건
                    </div>
                    {tabPosts.map(post => (
                      <PostRow
                        key={post.id}
                        post={post}
                        onClick={() => {
                          const board = boards.find(b => b.code === post.boardCode);
                          goToDetail(post.id, post.boardCode, board?.boardGroup ?? 'COMMUNITY');
                        }}
                      />
                    ))}
                    {tabTotalPages > 1 && (
                      <Pagination page={currentPage} totalPages={tabTotalPages} onPageChange={goToPage} />
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
