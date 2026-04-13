import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, isAdmin, isLoggedIn } from '../utils/authFetch';

export default function CourseListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [likeMap, setLikeMap] = useState({}); // { courseId: { liked, likeCount } }
  const isComposing = useRef(false);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, keyword, recruitingOnly, dateFrom, dateTo, sort]);

  const fetchCourses = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 12, keyword, sort });
    if (recruitingOnly) params.set('recruitingOnly', 'true');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo',   dateTo);
    const res = await authFetch(`/api/courses?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCourses(data.content);
      setTotalPages(data.totalPages);
      // likeMap 초기화
      const map = {};
      data.content.forEach(c => {
        map[c.id] = { liked: c.likedByMe ?? false, likeCount: c.likeCount ?? 0 };
      });
      setLikeMap(map);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
  };

  const handleLike = async (e, courseId) => {
    e.stopPropagation(); // 카드 클릭(상세 이동) 방지
    if (!isLoggedIn()) { navigate('/login'); return; }
    const res = await authFetch(`/api/courses/${courseId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLikeMap(prev => ({ ...prev, [courseId]: { liked: data.liked, likeCount: data.likeCount } }));
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 강의 목록</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">원하는 강의를 찾아 학습을 시작하세요</p>
        </div>
        {isAdmin() && (
          <button onClick={() => navigate('/courses/admin')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
            🛠️ 강의 관리
          </button>
        )}
      </div>

      {/* 검색 + 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6 space-y-3">
        {/* 키워드 검색 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => { isComposing.current = false; }}
            onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
            placeholder="강의명, 설명 검색..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400"
          />
          <button onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            검색
          </button>
        </div>

        {/* 기간 검색 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">기간</span>
          <input type="date" value={dateFrom} onChange={e => handleFilterChange(setDateFrom, e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400" />
          <span className="text-xs text-gray-400">~</span>
          <input type="date" value={dateTo} onChange={e => handleFilterChange(setDateTo, e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { handleFilterChange(setDateFrom, ''); handleFilterChange(setDateTo, ''); }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕ 초기화</button>
          )}
          <p className="text-[11px] text-gray-400">접수기간·교육기간 중 하나라도 해당하면 포함</p>
        </div>

        {/* 필터 버튼 + 정렬 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange(setRecruitingOnly, !recruitingOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                recruitingOnly
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'
              }`}>
              🟢 신청중만 보기
            </button>
          </div>
          <div className="flex gap-1">
            {[
              { key: 'latest',    label: '최신순' },
              { key: 'viewCount', label: '조회순' },
              { key: 'likeCount', label: '좋아요순' },
            ].map(s => (
              <button key={s.key}
                onClick={() => handleFilterChange(setSort, s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  sort === s.key
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 강의 목록 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-gray-400 dark:text-gray-500">불러오는 중...</div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <div>검색 결과가 없습니다</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const isRecruiting = course.registrationStartDate && course.registrationEndDate
              && today >= course.registrationStartDate && today <= course.registrationEndDate;
            return (
              <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden shrink-0">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-contain bg-gray-900" />
                  ) : (
                    <span className="text-4xl">📚</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-1.5 mb-1">
                    {isRecruiting && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium mt-0.5">접수중</span>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                  {course.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{course.description}</p>
                  )}
                  <div className="mt-auto space-y-0.5 pt-2 border-t border-gray-50 dark:border-gray-700">
                    {course.registrationStartDate && (
                      <p className="text-xs text-gray-400">📋 {course.registrationStartDate} ~ {course.registrationEndDate || '-'}</p>
                    )}
                    {course.educationStartDate && (
                      <p className="text-xs text-gray-400">🎓 {course.educationStartDate} ~ {course.educationEndDate || '-'}</p>
                    )}
                    {course.instructor && (
                      <p className="text-xs text-gray-400">👨‍🏫 {course.instructor}</p>
                    )}
                    {course.location && (
                      <p className="text-xs text-gray-400">📍 {course.location}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => handleLike(e, course.id)}
                          className={`flex items-center gap-0.5 text-[11px] transition-colors ${
                            likeMap[course.id]?.liked
                              ? 'text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}>
                          {likeMap[course.id]?.liked ? '❤️' : '🤍'}
                          {(likeMap[course.id]?.likeCount > 0) && (
                            <span>{likeMap[course.id].likeCount.toLocaleString()}</span>
                          )}
                        </button>
                        {course.viewCount > 0 && (
                          <span className="text-[11px] text-gray-400">👁 {course.viewCount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                page === i
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
