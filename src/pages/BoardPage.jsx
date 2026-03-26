import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

const PAGE_SIZE = 10;

const CATEGORY_TABS = [
  { value: 'ALL',    label: '전체' },
  { value: 'NOTICE', label: '📢 공지사항' },
  { value: 'FREE',   label: '💬 자유게시판' },
];

export default function BoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? 'ALL';
  const keyword  = searchParams.get('keyword') ?? '';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  useEffect(() => {
    loadPosts(category, keyword, currentPage);
  }, [searchParams.toString()]);

  const loadPosts = async (cat, kw, page) => {
    setLoading(true);
    const res = await authFetch(
      `/api/posts?category=${cat}&keyword=${encodeURIComponent(kw)}&page=${page}&size=${PAGE_SIZE}`
    );
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
    setLoading(false);
  };

  const switchCategory = (cat) => {
    setSearchParams({ category: cat });
  };

  const goToPage = (page) => {
    const params = { category };
    if (page + 1 > 1) params.page = String(page + 1);
    if (keyword) params.keyword = keyword;
    setSearchParams(params);
  };

  const handleKeywordChange = (e) => {
    const kw = e.target.value;
    const params = { category };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

  const canWrite = isLoggedIn;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">📋 게시판</h2>
          <div className="flex gap-2">
            {canWrite && (
              <button onClick={() => navigate('/board/write')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                ✏️ 글쓰기
              </button>
            )}
            <button onClick={() => navigate('/home')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
              ← 홈으로
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          {CATEGORY_TABS.map(tab => (
            <button key={tab.value} onClick={() => switchCategory(tab.value)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                category === tab.value ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-700">
              총 {totalElements}개
              <span className="ml-2 text-sm text-gray-400">({currentPage + 1} / {totalPages || 1} 페이지)</span>
            </span>
            <input type="text" placeholder="🔍 제목 또는 작성자 검색"
              value={keyword} onChange={handleKeywordChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-52"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">게시글이 없습니다.</div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['번호', '카테고리', '제목', '작성자', '날짜', '조회'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id}
                      className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/board/${post.id}`)}>
                      <td className="px-4 py-3 text-sm text-gray-400">{post.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.category === 'NOTICE'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {post.categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{post.title}</span>
                          {(Date.now() - new Date(post.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">NEW</span>
                          )}
                          {post.commentCount > 0 && (
                            <span className="shrink-0 text-xs text-blue-400 font-normal">💬 {post.commentCount}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{post.authorName}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{post.viewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이지네이션 */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
